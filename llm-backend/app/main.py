from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import bedrock
import os

app = FastAPI(
    title="LLM Backend",
    description="AWS Bedrock Claude 3 Sonnet API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bedrock.router)


@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "message": "LLM Backend is running",
        "model": "Claude 3 Sonnet (AWS Bedrock)",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
