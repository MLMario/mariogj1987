
from typing import Optional
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from urllib.parse import quote_plus

class Configuration(BaseSettings):
    
  model_config = SettingsConfigDict(
      env_file=".env",
      env_prefix="MENO_",      # allows MENO_* names but we also accept non-prefixed
      case_sensitive=False,
      extra="ignore",
  )

  # --- App / server ---
  app_name: str = "meno"
  env: str = "dev"
  log_level: str = "INFO"
  host: str = "0.0.0.0"
  port: int = 8000

  # ----- API KEYS -----

  GROQ_API_KEY: Optional[SecretStr] = Field(
    default = None,
    env = ["MENO_GROQ_API_KEY", "GROQ_API_KEY"],  
    description="API key for accessing the GROQ service"
  )

  # ---- Agent Settings ------
  TOTAL_MESSAGES_SUMMARY_TRIGGER: int = Field(
    default= 5,
    description="Number of messages after which the summary is triggered",
  )

  MODEL_NAME: str = Field(
    default="llama-3.3-70b-versatile",  # Default model name
    description="The name of the main model that handles conversations",
  ) #DEFAULT MODEL NAME

  FAST_MODEL_NAME: str = Field(
    default="llama-3.1-8b-instant",  # Default fast model name
    description="The name of the model that handles simple tasks like summarization and classification of questions intent",
  )

  MODEL_TEMPERATURE: float = Field(
    default=0.6,
    description="Default temperature to use for the model's responses (conversational)",
  )

  # --- Redis / queues ---
  redis_url: str = Field ( 
    default= "redis://redis:6379/0" ,
    description="Redis URL for the message queue, port is based on redic container build port",
)
  # --- MongoDB Atlas (s) ---

  ATLAS_MONGO_URL_TEMPLATE: str = Field(
    default = "mongodb+srv://<ATLAS_MONGO_USER>:<ATLAS_MONGO_PASS>@ragpv0.9ch50wb.mongodb.net/rag_test_v1",
    env = "MENO_ATLAS_MONGO_URI",
  )

  ATLAS_MONGO_USER: Optional[str] = Field(
    default = None, 
    env = ["MENO_ATLAS_MONGO_USER", "ATLAS_MONGO_USER"]
  )

  ATLAS_MONGO_PASS: Optional[SecretStr] = Field(
    default = None,
    env = ["MENO_ATLAS_MONGO_PASS", "ATLAS_MONGO_PASS"]
  )

  MONGO_DB_NAME: str= Field(
    default = 'rag_test_v1',
    env = ["MENO_MONGO_DB_NAME", "MONGO_DB_NAME"]
  )

  MONGO_STATE_CHECKPOINT_COLLECTION: str = Field(
    default = "trainer_test_v0_state_checkpoints",
    env = ["MENO_MONGO_STATE_CHECKPOINT_COLLECTION", "MONGO_STATE_CHECKPOINT_COLLECTION"]
  )
  MONGO_STATE_WRITES_COLLECTION: str = Field(
    default = "trainer_test_v0_state_state_writes",
    env = ["MENO_MONGO_STATE_WRITES_COLLECTION", "MONGO_STATE_WRITES_COLLECTION"]
  )

  MONGO_LONG_TERM_COLLECTION_EXERCISE: str = Field(
      default = "exercise_database",
      env = ["MENO_MONGO_LONG_TERM_COLLECTION_EXERCISE", "MONGO_LONG_TERM_COLLECTION_EXERCISE"]
    )

  @computed_field(return_type=str)

  def mongo_uri(self) -> str:

      uri = self.ATLAS_MONGO_URL_TEMPLATE

      needs_user = "<ATLAS_MONGO_USER>" in uri
      needs_pass = "<ATLAS_MONGO_PASS>" in uri

      if needs_user or needs_pass:
          
        if not self.ATLAS_MONGO_USER or not self.ATLAS_MONGO_PASS: 

          missing = []

          if needs_user and not self.ATLAS_MONGO_USER:
            missing.append("ATLAS_MONGO_USER")
        
          if needs_pass and not self.ATLAS_MONGO_PASS:
            missing.append("ATLAS_MONGO_PASS")

          raise ValueError(
            f"<Missing {', '.join(missing)} to be able to replace env in mongo URL>"
          )

        """
        quote_plus is commonly used to safely embed usernames/passwords into connection URIs,
           so special chars like @ : / ? & % don't break the URL.

        """
        user = quote_plus(self.ATLAS_MONGO_USER)
        pw = quote_plus(self.ATLAS_MONGO_PASS.get_secret_value())
        uri = (uri
                .replace("<ATLAS_MONGO_USER>", user)
                .replace("<ATLAS_MONGO_PASS>", pw))

      return uri


Configuration = Configuration()




