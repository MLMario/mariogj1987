
from langchain_core.runnables import RunnableConfig
from .chains import get_trainer_chain, get_summary_chain
from menotrainer.services.api.app.domain.prompts import(
    EXTRACT_EXERCISE_CARD
)

from .state import PhilosoferState
from .tools import retrieve_exercise_from_user_prompt, fetch_target_muscles
import json
from .helpers import get_exercise_data
from menotrainer.config import Configuration
from langchain_core.messages import RemoveMessage


"""

Bot now has needs to be able to retrieve context from an exercise database

Tools: 
- should_retrieve_exercise_context:
    - evaluates if users is aking information what muscle group an excerise is targeting


""" 
#  

async def conversation_node(state: PhilosoferState, config: RunnableConfig):

    messages = state.get("messages", [])
    summary = state.get("summary", "")
    exercise_data = get_exercise_data(state) #gets dictionarty from state and transforms it into a json string

    conversation_chain = get_trainer_chain() 

    response = await conversation_chain.ainvoke(
        {
            "messages": messages,
            "exercise_data": exercise_data,
            "summary": summary

        }
    )

    return {"messages": response}
    """
    Conversation Chain includes Bot Personality + messages state
    """

async def retrieve_exercise_content(state: PhilosoferState):

    messages = state.get("messages", [])
    summary = state.get("summary", "")
     # we dont need to use the funtcion to get in string case here since the objective is to manipulate this state
    exercise_data = state.get("exercises_data", {
        "exercises_user_ask_about": [],
        "main_muscle_target": []
    })

    unique_exercises = await retrieve_exercise_from_user_prompt(state)

    if not unique_exercises:
        # in this case the LLM decidded the user was asking aboout an exercise but it was nto able to extract any exercise, which means exercise data wont be updated and it might go into an infite loop
        # we need to break the loop somehow, maybe update a string value in state to "dont perform search" , and have should retrieve function return false , in the connector node we can update the state back to null if the user asks agains

        return{"exercises_data": exercise_data, "search_exercises": 'dont perform search'}

    query_results = await fetch_target_muscles(unique_exercises)

    for ex, muscle in query_results.items():

        exercise_data['exercises_user_ask_about'].append(ex)
        exercise_data['main_muscle_target'].append(muscle)


    return {"exercises_data": exercise_data}



async def connector_node(state: PhilosoferState):
    
    search_exercises = ""

    return {"search_exercises": search_exercises}

async def summarize_conversation_node(state: PhilosoferState):
    
    summary = state.get("summary", "")
    messages = state.get("messages", [])

    summary_chain  = get_summary_chain(summary)

    response = await summary_chain.ainvoke(
        {
            "summary": summary,
            "messages": messages    
        }
    )

    deleted_messages = [
        RemoveMessage(id=m.id)
        for m in state["messages"][:-Configuration.TOTAL_MESSAGES_SUMMARY_TRIGGER]
    ]

    return {"summary": response.content , "messages": deleted_messages}
