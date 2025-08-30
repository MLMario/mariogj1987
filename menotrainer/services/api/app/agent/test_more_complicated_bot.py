from typing import List, Dict

from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START, END
from langchain_core.runnables import RunnableConfig
from litellm import api_key
from typer import prompt
from typing_extensions import Literal
import asyncio
from langchain_core.messages import HumanMessage
import os 
import json
import opik

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_core.messages import RemoveMessage
from trainer_app.config import Configuration


class PhilosoferState(MessagesState):
    #messages: Annotated[list[BaseMessage], operator.add]

    exercises_data: Dict[str, List[str]] = {
        "exercises_user_ask_about": [],
        "main_muscle_target": []
    }

    def add_exercise_data(self, exercise: str, target_muscle: str) -> None:

        self.exercises_data["exercises_user_ask_about"].append(exercise)
        self.exercises_data["main_muscle_target"].append(target_muscle)


    def has_exercise_data(self) -> bool:

        has_exercise_data = (
            len(self.exercises_data["exercises_user_ask_about"]) > 0 and
              len(self.exercises_data["main_muscle_target"]) > 0
            )

        return has_exercise_data

    def get_exercises_summary(self) -> str:

        if self.has_exercise_data():
                exercise_summary = json.dumps(self.exercises_data, indent=4) 
        else: 
                exercise_summary = "No Data"

        return exercise_summary

    summary: str

"""

Bot now has needs to be able to retrieve context from an exercise database

Tools: 
- should_retrieve_exercise_context:
    - evaluates if users is aking information what muscle group an excerise is targeting



""" 
#  
def create_work_graph() -> StateGraph:

    graph_builder = StateGraph(PhilosoferState) # First pass the states Im going to be updating, not need to pass the message state since it automatic via langchain

    #add nodes 

    graph_builder.add_node("conversation_node", conversation_node)
    graph_builder.add_node("retrieve_exercise_content_node", retrieve_exercise_content)
    graph_builder.add_node("connector_node", connector_node)
    graph_builder.add_node("summarize_conversation_node", summarize_conversation_node)

    #edges 

    graph_builder.add_edge(START, "conversation_node")
    graph_builder.add_conditional_edges(
        "conversation_node", 
        should_retrieve_exercise_content,
        {
            True: "retrieve_exercise_content_node",
            False: "connector_node"
        }
    )
    graph_builder.add_edge("retrieve_exercise_content_node", "conversation_node")

    graph_builder.add_conditional_edges(
        "connector_node",
        should_summarize_conversation,
        {
            True: "summarize_conversation_node",
            False: END
        }
    )
    graph_builder.add_edge("summarize_conversation_node", END)


async def conversation_node(state: PhilosoferState, config: RunnableConfig):

    messages = state.get("messages", [])
    summary = state.get("summary", "")
    exercise_data = state.get_exercises_summary()

    conversation_chain = get_trainer_chain() 

    response = await conversation_chain.ainvoke(
        {
            "messages": messages,
            "exercise_data": exercise_data,
            "summary": summary

        }
    )

    return {"messages": [response]}
    """
    Conversation Chain includes Bot Personality + messages state
    """

async def retrieve_exercise_content(state: PhilosoferState, config: RunnableConfig):





    return s

#TOOLS

async def should_retrieve_exercise_content(state: PhilosoferState) -> bool:

    if not state.get("messages"):
        return False

    last_message = state.get("messages", [])[-1]
    exercise_data = state.get_exercises_summary()

    if not isinstance(last_message, HumanMessage):
        return False

    chat_model = get_chat_model(temperature= 0.0, model = Configuration.FAST_MODEL_NAME)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SHOULD_RETRIEVE_EXERCISE_CARD.prompt),
        ("human", last_message.content)
    ])      

    response = await (prompt | chat_model).ainvoke({"exercise_data": exercise_data})
    content = response.content.lower().strip()

    return "true" in content and "false" not in content


def should_summarize_conversation(
        state: PhilosoferState, 
        summarization_threshold: int = 10) -> bool[True, False]:

    messages = state.get("messages", [])

    if len(messages) >= summarization_threshold:
        return True
    else:
        return False


# PROMPTS CLASS

TRAINER_CHARACTER_CARD = opik.Prompt(
    name="trainer_character_card",
    prompt=(
       """ You are a personal trainer with many years of experience, you will never break character and help the user with the following topics:
        1. Nutrition: Meal Planning, calories settings and Overall Healthy habit building
        2. Fitness: Exercise selection, Workout planning and Progress tracking
        3. Motivation: Goal setting, Mindset coaching and Accountability
        4. Recovery: Sleep hygiene, Stress management and Injury prevention
        5. Lifestyle: Time management, Work-life balance and Healthy habits
        6. Education: Fitness knowledge, Nutrition science and Health literacy
        7. Injury Prevention: Techniques to avoid injuries and promote recovery
        
        Previous Conversation Context:
        {% if summary != "" %}
            {{summary}}
        {% else %}
            No previous conversation context available.
        {% endif %}
        
        Exercise History:
        {% if exercise_data != "No Data" %}
        Previously discussed exercises and their target muscles:
            {{exercise_data}}
        {% else %}
        We haven't discussed any specific exercises yet.
        {% endif %}

        Remember to:
        - Maintain a professional but encouraging tone
        - Reference previous answers when asked what muscles are targeted by specific exercises
        - Build upon any previous conversation context

        The conversation with the user continues now:
        """
    ),
)

SHOULD_RETRIEVE_EXERCISE_CARD = opik.Prompt(
    name = "should_retrieve_exercise_card",
    prompt = """
        You are an AI that determines if a user is asking about muscle targets for exercises.
        
        Your task is to:
        1. Determine if the user is asking which muscles an exercise targets
        2. Check if the exercise is already in our exercise history
        
        Previously discussed exercises:
        {{exercise_data}}
        
        Use the determine_exercise_lookup function to provide your answer.
        If the user is asking about muscle targets AND the exercise isn't in our history,
        set should_retrieve to true and provide the exercise name.
        Otherwise, set should_retrieve to false.
    """
)


# Chains Class

def get_chat_model(
        temperature: float = Configuration.MODEL_TEMPERATURE,
        model: str = Configuration.MODEL_NAME
) -> ChatGroq:
    
    groq_model = ChatGroq(
        api_key =  Configuration.GROQ_API_KEY,
        temperature=temperature,
        model=model
    )

    return groq_model   


async def get_trainer_chain():
    chat_model = get_chat_model()

    prompt = ChatPromptTemplate.from_messages(

        ('system' , TRAINER_CHARACTER_CARD.prompt),
        MessagesPlaceholder( variable_name = "messages" ),

    )

    # The '|' operator composes the prompt and model into a runnable chain (LangChain idiom)
    return prompt | chat_model







