
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import get_chat_model
from services.api.app.domain.prompts import TRAINER_CHARACTER_CARD


def get_trainer_chain():

    chat_model = get_chat_model()

    prompt = ChatPromptTemplate.from_messages([

        ('system' , TRAINER_CHARACTER_CARD.prompt),
        MessagesPlaceholder( variable_name = "messages" )],
        template_format="jinja2",
    )

    # The '|' operator composes the prompt and model into a runnable chain (LangChain idiom)
    return prompt | chat_model


