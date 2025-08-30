import asyncio
from langchain_core.messages import HumanMessage

# Import your graph + state
from menotrainer.services.api.app.agent.graph import create_work_graph
from menotrainer.services.api.app.agent.state import PhilosoferState

async def main_test(message_history):
    # 1) Build & compile the graph
    builder = create_work_graph()
    graph = builder.compile()

    # 2) Minimal initial state (barebones, but extendable)
    init_state = PhilosoferState(
        messages = message_history
    )

    # 3) Run one turn
    final_state = await graph.ainvoke(init_state)

    # 4) Inspect results
    msgs = final_state.get("messages", [])
    summary = final_state.get("summary", "")
    exercises = final_state.get("exercises_data", {})

    # Find the latest AI reply (last non-human message)
    assistant_text = None

    for m in reversed(msgs):
        # HumanMessage has .type == "human"; AI reply will not
        if getattr(m, "type", None) != "human":
            assistant_text = getattr(m, "content", "")
            break

    print("\n=== Assistant Reply ===")
    print(assistant_text or "(No assistant reply found)")

    print("\n=== Summary (if any) ===")
    print(summary or "(empty)")

    print("\n=== Exercises Data (if any) ===")
    print(exercises or "{}")

    # 5) Return state so you can chain more turns later
    return final_state

if __name__ == "__main__":
    # Windows-friendly asyncio entrypoint
    try:
        asyncio.run(main_test())
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main_test())
