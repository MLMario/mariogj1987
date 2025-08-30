

from .state import PhilosoferState
from langchain_core.messages import HumanMessage
from menotrainer.config import Configuration
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import get_chat_model
from .helpers import last_user_text , get_exercise_data
from menotrainer.config import Configuration
from pydantic import BaseModel, Field
from typing import Literal

from menotrainer.services.api.app.domain.prompts import (
    SHOULD_RETRIEVE_EXERCISE_CARD
)


class RetrieveDecision(BaseModel):

    decision: Literal['true','false'] = Field(
        description="Return 'true' if the user is asking about a specific exercise and we should retrieve content, 'false' otherwise."
    )


async def should_retrieve_exercise_content(state: PhilosoferState) -> bool:

    if not state.get("messages","") or state.get("search_exercises","") == 'dont perform search':
        return False

    last_message = last_user_text(state)
    exercise_data = get_exercise_data(state)

    if last_message is None:
        return False

    chat_model = get_chat_model(
        temperature= 0.0, 
        model = Configuration.MODEL_NAME
        ).with_structured_output(RetrieveDecision)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SHOULD_RETRIEVE_EXERCISE_CARD.prompt),
        ("human", last_message)],
        template_format="jinja2"
        )

    response = await (prompt | chat_model).ainvoke({"exercise_data": exercise_data})
    
    print("Should retrieve exercise content AI response:", response)

    return response.decision == "true"



def should_summarize_conversation(
        state: PhilosoferState, 
        summarization_threshold: int = 10) -> bool:

    messages = state.get("messages", [])

    print("Numbber of messages in state", len(messages))

    if len(messages) >= Configuration.TOTAL_MESSAGES_SUMMARY_TRIGGER:
        return True
    else:
        return False