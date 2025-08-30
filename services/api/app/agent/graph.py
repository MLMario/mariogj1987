
from .state import PhilosoferState
from langgraph.graph import StateGraph, START, END
from .nodes import conversation_node, retrieve_exercise_content, connector_node, summarize_conversation_node
from .edges import should_retrieve_exercise_content, should_summarize_conversation


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

    return graph_builder