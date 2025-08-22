# app_test.py
import asyncio
import chainlit as cl
from langchain_core.messages import HumanMessage, AIMessage
import uuid
from trainer_app.config import Configuration
from test_script_mario import create_persistent_graph, new_state, create_simple_workflow_graph
from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver


@cl.on_chat_start
async def on_start():
    # Create a unique thread ID for this session
    #thread_id = f"rag_project_test_v0-{uuid.uuid4()}"
    thread_id = "rag_project_test_v0-d08c549b-dcf6-4be8-b4c3-b74549f3bd96"

    cl.user_session.set("thread_id", thread_id)

    # Create a graph for this session
    graph = create_simple_workflow_graph()



    # this part if only if we want to retrieve a past conversation
    try:
        saver_ctx = AsyncMongoDBSaver.from_conn_string(
            conn_string=Configuration.MONGO_URI,
            db_name=Configuration.MONGO_DB_NAME,
            checkpoint_collection_name=Configuration.MONGO_STATE_CHECKPOINT_COLLECTION,
            writes_collection_name=Configuration.MONGO_STATE_WRITES_COLLECTION,
        )
        
        saver = await saver_ctx.__aenter__()

        graph_compiled = graph.compile(checkpointer=saver)

        config = {"configurable": {"thread_id": thread_id}}

        snapshot = await graph_compiled.aget_state(config)  # <-- restore state from MOngdo DB

        if snapshot and getattr(snapshot, "values", None):
            state = snapshot.values  # last saved state dict (e.g., {"messages":[...], ...})
        else:
            

        if graph_compiled is None:
            await cl.Message("Graph is not compiled. Please start the session.").send()
            return
        
    except Exception as e:
        await cl.Message(f"Startup error: {e}").send()
        raise

    # Store both state and graph in session
    cl.user_session.set("state", state)

    cl.user_session.set("graph", graph)
  
    await cl.Message("Hi! I'm your trainer. Ask me anything about training, nutrition, or recovery.").send()

@cl.on_message
async def on_message(message: cl.Message):

    #gets all the define session variables on start

    state = cl.user_session.get("state")
    thread_id = cl.user_session.get("thread_id")
    graph = cl.user_session.get("graph")

    #Opens DBMongo connection and compiles the graph
    try:
        saver_ctx = AsyncMongoDBSaver.from_conn_string(
            conn_string=Configuration.MONGO_URI,
            db_name=Configuration.MONGO_DB_NAME,
            checkpoint_collection_name=Configuration.MONGO_STATE_CHECKPOINT_COLLECTION,
            writes_collection_name=Configuration.MONGO_STATE_WRITES_COLLECTION,
        )
        
        saver = await saver_ctx.__aenter__()

        graph_compiled = graph.compile(checkpointer=saver)

        if graph_compiled is None:
            await cl.Message("Graph is not compiled. Please start the session.").send()
            return

        # Append user's message as a HumanMessage
        state["messages"].append(HumanMessage(content=message.content))

        # Call your LangGraph with the config that includes thread_id
        config = {
                "configurable": {"thread_id": thread_id}
            }
            
        result = await graph_compiled.ainvoke(state, config)

        # Update session state
        cl.user_session.set("state", result)

        # The last message in messages should be the model reply
        ai_msg = result["messages"][-1]

        await cl.Message(getattr(ai_msg, "content", str(ai_msg))).send()


    #throws an exception is the connection or graph compilation fails
    except Exception as e:
        await cl.Message(f"Startup error: {e}").send()
        raise

@cl.on_stop
async def on_stop():
    # 5) Cleanly EXIT the context manager you opened
    saver_ctx = cl.user_session.get("saver_ctx")
    if saver_ctx is not None:
        try:
            await saver_ctx.__aexit__(None, None, None)
        except Exception:
            pass