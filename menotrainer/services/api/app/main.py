from fastapi import FastAPI


app = FastAPI(title="Placeholder API")

@app.get("/")
def read_root():
    return {"message": "Infrastructure setup complete!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}