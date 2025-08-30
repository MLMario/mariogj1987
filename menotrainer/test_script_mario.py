from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START, END
from langchain_core.runnables import RunnableConfig
from typing_extensions import Literal
import asyncio
from langchain_core.messages import HumanMessage
import os 
import uuid

import opik

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_core.messages import RemoveMessage

from mario_test_settings import Configuration

from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver


class PhilosoferState(MessagesState):
    #messages: Annotated[list[BaseMessage], operator.add]
    summary: str

def create_simple_workflow_graph() -> StateGraph:
    graph_builder  = StateGraph(PhilosoferState)
    
    #add nodes 

    graph_builder.add_node("conversation_node",conversation_node)
    graph_builder.add_node("summarize_conversation_node", summarize_conversation_node)

    #define the flow 

    graph_builder.add_edge(START,"conversation_node")
    graph_builder.add_conditional_edges(
             "conversation_node", ## After running this node
             should_summarize_conversation, #use this function and compare whatever it returns with
                {"next_node": "summarize_conversation_node", #if it returns the value "summarize_conversation_node", the from conversation with fo to "summarize_conversation_node" , other wise, from conversation we go to END 
                  "__end__": END},
)
    graph_builder.add_edge("summarize_conversation_node", END)

    
    return graph_builder

async def conversation_node(state: PhilosoferState, config: RunnableConfig): 
    summary = state.get("summary", "")
    conversation_chain = get_trainer_reponse_chain() #this function already has called for the model and it;s already sending a prompt with the trainer personality

    response = await conversation_chain.ainvoke(
        {
            "messages": state["messages"],
            "summary": summary,
        },
        config,
    )
    
    return {"messages": [response]}


summarization_threshold = Configuration.TOTAL_MESSAGES_SUMMARY_TRIGGER

async def summarize_conversation_node(state: PhilosoferState):
    summary = state.get("summary", "")
    summary_chain = get_conversation_summary_chain(summary)

    response = await summary_chain.ainvoke(
        {
            "messages": state["messages"],
            "summary": summary,
        }
    )

    delete_messages = [
        RemoveMessage(id=m.id)
        for m in state["messages"][: -summarization_threshold]
    ]
    
    return {"summary": response.content, "messages": delete_messages}

    # the return IS IMPORTANT , basically we are telling Langgraph to pass to messages (which is the messaged history in the StateClass)
    # to delete messaged that are in the delete message list. WE are doing this by adding the RemoveMessage Function as part of the list 
    # this type of syntax is called a Sentinel, in particular this is one that LangGraph understands. We are also telling it to delete by message id. 
    # the m.id is basically telling to delete using the message reponse id (which LangGraph save as the chat history increases)


# FUNCTION for conditional edges, basically, we use a function to either return the END node from the edge 
def should_summarize_conversation(state: PhilosoferState,) -> Literal["next_node", "__end__"]:
    messages = state["messages"]

    if len(messages) >= summarization_threshold:
        return "next_node"

    return "__end__"



#We need to connect fro Groq to be able to call the Llama model,
# this will allow us also to get the history of the conversation


def get_chat_model(
        temperature: float = Configuration.MODEL_TEMPERATURE, 
        model: str = Configuration.MODEL_NAME):

    groq_model = ChatGroq(
        api_key=Configuration.GROQ_API_KEY,
        model_name=model,
        temperature=temperature,
    )

    return groq_model

# we can get the previous conversation leveraging prompt functions already implemented in langchain_core.prompts

# first lest define a character card for the propt, this is a fixed string that the model will always look first,
# the langgraph graph function will make sure it is. Using the function Prompt makes the prompt be an Obink object
# but it could be a simple text string also. 
TRAINER_CHARACTER_CARD = opik.Prompt(
    name="trainer_character_card",
    prompt=(
       """ You are a personal trainer with many years of experience, you will never break character and help the user only with 3 topics
        1. Nutrition: Meal Planning, calories settings and Overall Healthy habit building
        2. Fitness: Exercise selection, Workout planning and Progress tracking
        3. Motivation: Goal setting, Mindset coaching and Accountability
        4. Recovery: Sleep hygiene, Stress management and Injury prevention
        5. Lifestyle: Time management, Work-life balance and Healthy habits
        6. Education: Fitness knowledge, Nutrition science and Health literacy
        7. Injury Prevention: Techniques to avoid injuries and promote recovery
        
        As added context this is the summary of the previous conversation with the user:

                {{summary}}
        
        The conversation with the user starts now
        """
    ),
)



def get_trainer_reponse_chain():
    model = get_chat_model()
    # model = model.bind_tools(tools) # this giving the model the "tools they can use", in this case we only have one tool to retrieve context from the "long memory" which is a database with data about philosophers
    # CRITICAL part of RAG, basically adding the information we need

    system_message = TRAINER_CHARACTER_CARD

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",system_message.prompt),
            MessagesPlaceholder(variable_name="messages"), ## this is a place holder which we will use to pass the chat history
        ],
        template_format="jinja2",
    
    )

    # The '|' operator composes the prompt and model into a runnable chain (LangChain idiom)
    return prompt | model


SUMMARY_PROMPT = opik.Prompt(
    name = "summary_prompt",
    prompt = """Create a summary of the conversation between trainer and the user.
            The summary must be a short description of the conversation so far, but that also captures all the
            relevant information shared by the user like weight, height, fitness goals, and any other pertinent details.""" ,
)   

EXTEND_SUMMARY_PROMPT = opik.Prompt(
    name = "extend_summary_prompt",
    prompt = """This is a summary of the conversation between trainer and the user.
            
            {{summary}}

            Extend the summary by taking into account the new messages above: """,
    )

def get_conversation_summary_chain(summary: str = ""):
    model = get_chat_model(model = Configuration.SUMMARY_MODEL_NAME)

    summary_message = EXTEND_SUMMARY_PROMPT if summary else SUMMARY_PROMPT

    prompt = ChatPromptTemplate.from_messages(
        [
            MessagesPlaceholder(variable_name="messages"), #this is placing the message history from state it can detect the state sin the state is a MessageState
            ("human", summary_message.prompt), # adding the summary message to the prompt as a USER, basically, previous message will end with user so adding a new message as text only will make the ai think it's a AI response, we add human to tell the AI this is the Human propmt 
        ],
        template_format="jinja2",
    )

    return prompt | model



# for when we run the chat again we can use this function to clear the state
def new_state():
    """Return a fresh per-session state dict for the graph."""
    return {"messages": [], "summary": ""}  # [NEW]

async def create_persistent_graph(thread_id: str, graph,state):
    """Create a graph with MongoDB persistence"""
    
    try:
        async with AsyncMongoDBSaver.from_conn_string(
            conn_string=Configuration.MONGO_URI,
            db_name=Configuration.MONGO_DB_NAME,
            checkpoint_collection_name=Configuration.MONGO_STATE_CHECKPOINT_COLLECTION,
            writes_collection_name=Configuration.MONGO_STATE_WRITES_COLLECTION,
        ) as checkpointer:
            
            graph_builder = graph.compile(checkpointer=checkpointer)
            
            config = {
                "configurable": {"thread_id": thread_id}
            }
            
            response = await graph_builder.ainvoke(state, config)

            return response
   
    except Exception as e:
        raise RuntimeError(f"Error creating persistent graph: {str(e)}") from e


if __name__ == "__main__":
    pass


""" In case you want to run a quick test
async def main():
     messages = await graph.ainvoke({"messages": [HumanMessage(content="Hello, how are you?")]})
     for message in messages["messages"]:
         print(message)

         """