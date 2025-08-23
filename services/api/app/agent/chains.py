
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import get_chat_model
from services.api.app.domain.prompts import TRAINER_CHARACTER_CARD, SUMMARY_EXTEND_PROMPT_CARD, SUMMARY_PROMPT_CARD


def get_trainer_chain():

    chat_model = get_chat_model()

    prompt = ChatPromptTemplate.from_messages([

        ('system' , TRAINER_CHARACTER_CARD.prompt),
        MessagesPlaceholder( variable_name = "messages" )],
        template_format="jinja2",
    )

    # The '|' operator composes the prompt and model into a runnable chain (LangChain idiom)
    return prompt | chat_model

def get_summary_chain(summary = ""):


    chat_model = get_chat_model()

    summary_prompt = SUMMARY_EXTEND_PROMPT_CARD if summary else SUMMARY_PROMPT_CARD

    prompt = ChatPromptTemplate.from_messages([
        MessagesPlaceholder(variable_name="messages"),
        ("human", summary_prompt.prompt),

    ], template_format="jinja2",)


    return prompt | chat_model