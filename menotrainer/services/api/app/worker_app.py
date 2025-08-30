from celery import Celery
from loguru import logger

# Create Celery instance
celery_app = Celery(
    "menotrainers-worker",
    broker="redis://redis:6379/0",      # Redis as message broker
    backend="redis://redis:6379/0"      # Redis as result backend
)

# Basic Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Placeholder task for testing
@celery_app.task(name="test_task")
def test_task(message: str = "Hello from Celery!"):
    """
    Placeholder task to verify Celery is working.
    """
    logger.info(f"Processing test task with message: {message}")
    return {
        "status": "completed",
        "message": message,
        "worker": "menotrainers-worker"
    }

# Health check task
@celery_app.task(name="health_check")
def health_check():
    """
    Simple health check task.
    """
    logger.info("Health check task executed")
    return {"status": "healthy", "timestamp": "placeholder"}

# Placeholder for future ML/AI tasks
@celery_app.task(name="process_data")
def process_data(data: dict):
    """
    Placeholder for data processing tasks.
    """
    logger.info(f"Processing data: {data}")
    # TODO: Add your data processing logic here
    return {"status": "processed", "data": data}

if __name__ == "__main__":
    # For testing purposes
    print("Celery app created successfully!")
    print(f"Broker: {celery_app.conf.broker_url}")
    print(f"Backend: {celery_app.conf.result_backend}")