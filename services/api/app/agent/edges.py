

from .state import PhilosoferState
from langchain_core.messages import HumanMessage
from menotrainer.config import Configuration
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import get_chat_model
from .helpers import last_user_text , get_exercise_data

from menotrainer.services.api.app.domain.prompts import (
    SHOULD_RETRIEVE_EXERCISE_CARD
)


async def should_retrieve_exercise_content(state: PhilosoferState) -> bool:

    if not state.get("messages","") or state.get("search_exercises","") == 'dont perform search':
        return False

    last_message = last_user_text(state)
    exercise_data = get_exercise_data(state)

    if last_message is None:
        return False

    chat_model = get_chat_model(temperature= 0.0, model = Configuration.FAST_MODEL_NAME)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SHOULD_RETRIEVE_EXERCISE_CARD.prompt),
        ("human", last_message)],
        template_format="jinja2"
        )

    response = await (prompt | chat_model).ainvoke({"exercise_data": exercise_data})
    
    content = response.content.lower().strip()

    return "true" in content and "false" not in content



def should_summarize_conversation(
        state: PhilosoferState, 
        summarization_threshold: int = 10) -> bool:

    messages = state.get("messages", [])

    if len(messages) >= summarization_threshold:
        return True
    else:
        return False