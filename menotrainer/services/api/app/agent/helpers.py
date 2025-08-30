
from .state import PhilosoferState
from langchain_core.messages import HumanMessage
import json

def last_user_text(state: PhilosoferState) -> str:

    for m in reversed(state.get("messages", [])):
       
        if isinstance(m, HumanMessage):
            return m.content if isinstance(m.content, str) else str(m.content)
    
    return None 

def get_exercise_data(state: PhilosoferState) -> str:

    exercise_data = state.get("exercises_data", {
        "exercises_user_ask_about": [],
        "main_muscle_target": []
    })

    return json.dumps(exercise_data, indent=4)