
from typing import List, Dict
from langgraph.graph import MessagesState



"""
    #currently unused (should go inside the class as a method ), the LLM are evaluating this but would like to extend to outside the LLM
    def has_exercise_data(self) -> bool:
        has_exercise_data = (
            len(self.exercises_data["exercises_user_ask_about"]) > 0 and
              len(self.exercises_data["main_muscle_target"]) > 0
            )

        return has_exercise_data
"""

class PhilosoferState(MessagesState):

    summary: str
    exercises_data: Dict[str, List[str]]
    search_exercises: str 



"""

    def add_exercise_data(self, exercise: str, target_muscle: str) -> None:

        self.exercises_data["exercises_user_ask_about"].append(exercise)
        self.exercises_data["main_muscle_target"].append(target_muscle)
    def get_exercises_summary(self) -> str:

        if self.has_exercise_data():
                exercise_summary = json.dumps(self.exercises_data, indent=4) 
        else: 
                exercise_summary = "No Data"

        return exercise_summary
        """

    
