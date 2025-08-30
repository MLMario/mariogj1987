
from .state import PhilosoferState
from langgraph.graph import StateGraph, START, END
from .nodes import conversation_node, retrieve_exercise_content, connector_node, summarize_conversation_node
from .edges import should_retrieve_exercise_content, should_summarize_conversation
from langgraph.prebuilt import tools_condition

def create_work_graph() -> StateGraph:

    graph_builder = StateGraph(PhilosoferState) # First pass the states Im going to be updating, not need to pass the message state since it automatic via langchain

    #add nodes 


    graph_builder.add_node("extract_user_data_node", extract_user_data_node)

    graph_builder.add_node("conversation_node", conversation_node)

    graph_builder.add_node("extract_knowledge_node", extract_knowledge_node)

    graph_builder.add_node("summarize_knowledge_node", summarize_knowledge_node)

    graph_builder.add_node("connector_node", connector_node)

    graph_builder.add_node("save_to_episodic_memory_node", save_to_episodic_memory_node)

    graph_builder.add_node("reset_knowledge_node", reset_knowledge_node)

    graph_builder.add_node("summarize_conversation_node",summarize_conversation_node)

    #edges 

    graph_builder.add_edge(START, "extract_user_data_node")
    graph_builder.add_edge("extract_user_data_node", "conversation_node")

    graph_builder.add_conditional_edges(
        "conversation_node", 
        tools_condition,
         {
            "tools": "extract_knowledge_node",
            END: "connector_node"
        }
    )
    graph_builder.add_edge("extract_knowledge_node", "summarize_knowledge_node")

    graph_builder.add_edge("summarize_knowledge_node", "conversation_node")

    graph_builder.add_conditional_edges(
        "connector_node",
        tools_condition,
        {
            True: "save_to_episodic_memory_node",
            False: "reset_knowledge_node"
        }
    )

    graph_builder.add_edge("save_to_episodic_memory_node","reset_knowledge_node")
    
    graph_builder.add_conditional_edges(
        "reset_knowledge_node",
        should_summarize_conversation,
        {
            True : "summarize_conversation_node",
            False: END
        }
    )

    graph_builder.add_edge("summarize_conversation_node", END)

    return graph_builder


"""
What Every Node and conditional Edges does:

** extract_user_data_node **

- Extracts user data at the beggining of each conversation. User data is weight and menopayse sysmtoms and intensity, both over time. 
- user data is populated by user using UI

** conversation_node ** 
- Main conversation node to invoke response. will include persona, user data and extracted knowledge

** extract_knowledge_node **
- extract_knowledge_node is a ToolNode
- Flow is to import create_retriever_tool which is a wrapper for the retriever function 
(that retrives the data from MDMongo). Somthing like this:

retriever = function fo retrieve data
writer = function to write episodic memory

knowledge_tool = create_retriever_tool(
    retriever,n
    "extract_knowledge_node",
    "Always use this tool when the user asks you about menopause symptoms, treatments and general information. 
    also when user ask you about recommendations to treat thier symtoms",
)

episodic_knoledge_tool = create_retriever_tool(
    writer, 
    "save_to_episodic_memory_node",
    "Always use this tool when a question.....

)

tools = [knowledge_tool,episodic_knoledge_tool]

extract_knowledge_node = ToolsNode[tools]

- how do we tell the graph whic tool to use?

** summarize_knowledge_node **

-- summarizes extracted knowledge for context window size management
-- also creates metadata about the situation the knowledge is being pulled in this format:
  {
  "Situation" : "user ask about menopause symptoms" ,
  "AI action" : "extracted knowledge and summarize it to respond to user queries",
   "Summary": "Most common menopause symptoms are... "
  }

** connector_node ** 

helps push the conversation forward after knowledge has been extracted

** reset_knowledge_node **

** save_to_episodic_memory_node ** 

- leverages summarize context output to save relevant information to episodic memory
- updates episodic memory with new user data and extracted knowledge

** reset_knowledge_node **

- reset knowledge status POST response to user 

** summarize_conversation_node **

- summarizes conversation with user if conversation is above certain length

"""