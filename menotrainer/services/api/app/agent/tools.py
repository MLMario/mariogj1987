

from langchain_groq import ChatGroq
from typing import List, Dict, Any
from menotrainer.config import Configuration
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from .helpers import last_user_text
from .state import PhilosoferState   
from langchain_core.prompts import ChatPromptTemplate
from menotrainer.services.api.app.domain.prompts import (
    EXTRACT_EXERCISE_CARD
)
import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient


# this class will be fed to a langchain function with_structure_output that forces the output to match this structure, we could feed a simple schema string but this
# we get a more robust validation process of the output and also the nice excercise we can eaccess easitly 
class ExerciseList(BaseModel):
    
    exercises: List[str] = Field(
        default_factory=list,
        description="Unique, canonical exercise names as strings. Empty list if none."
    )


def get_chat_model(
        temperature: float = Configuration.MODEL_TEMPERATURE,
        model: str = Configuration.MODEL_NAME
) -> ChatGroq:
    
    groq_model = ChatGroq(
        api_key=Configuration.GROQ_API_KEY,
        temperature=temperature,
        model=model
    )

    return groq_model   

async def retrieve_exercise_from_user_prompt(state: PhilosoferState) -> list[str]:

    if not state.get("messages"):
        return []

    last_message = last_user_text(state) #already extract content through last_user_text function

    if last_message is None:
        return []

    chat_model = get_chat_model(
        temperature= 0.0, 
        model = Configuration.FAST_MODEL_NAME
        ).with_structured_output(ExerciseList)

    prompt = ChatPromptTemplate.from_messages([
        ("system", EXTRACT_EXERCISE_CARD.prompt),
        ("human", last_message)
    ])      

    response = await (prompt | chat_model).ainvoke({})
    raw_list = response.exercises
    unique_exercises_np = np.unique([ex.strip().lower() for ex in raw_list if ex.strip()])
    unique_exercises = [str(ex) for ex in unique_exercises_np.tolist()]
    
    return unique_exercises

async def fetch_target_muscles(unique_exercises: List[str]) -> Dict[str, Any]:
    
    MISSING = "No Data Found"
    mapping: Dict[str, str] = {ex: MISSING for ex in unique_exercises}

    if not unique_exercises:
        return mapping

    client = AsyncIOMotorClient(Configuration.mongo_uri)
    db = client[Configuration.MONGO_DB_NAME]
    coll = db[Configuration.MONGO_LONG_TERM_COLLECTION_EXERCISE]

    # Faster: one query with $in instead of looping
    # is basically a dictionary made out the collection in Mongo DB
    for ex in unique_exercises:
        print(ex)
        pipeline = [
            {"$search": {
                "index": 'exercise_serach_fuzzy',  # your Atlas Search index name
                "text": {
                    "path": "Exercise",
                    "query": ex,
                    "fuzzy": {
                        "maxEdits": 1,        # 0=exact only, 1–2 allow typos
                        "prefixLength": 1,    # first N chars must match exactly (helps precision)
                        "maxExpansions": 50
                    }
                }
            }},
            {"$project": {
                "_id": 0,
                "Exercise": 1,
                "Target Muscle Group ": 1,
                "score": {"$meta": "searchScore"}
            }},
            {"$limit": 1}
        ]

        docs = await coll.aggregate(pipeline).to_list(length=2)
        
        if docs:
            
            best = docs[0]
            mapping[ex] = best.get("Target Muscle Group ", MISSING)

    return mapping