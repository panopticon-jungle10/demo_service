import os
import logging
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from app.routers import chat, analytics

from panopticon_monitoring import MonitoringSDK

# Load environment variables from project root

load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="LLM Backend",
    description="AWS Bedrock Claude 3 Sonnet Q&A API with Auto-posting",
    version="1.0.0",
)

# Initialize Panopticon Monitoring SDK
MonitoringSDK.init(
    app,
    {
        "api_key": os.getenv("PANOPTICON_API_KEY"),
        "service_name": os.getenv("PANOPTICON_SERVICE_NAME"),
        "endpoint": os.getenv("PANOPTICON_ENDPOINT"),
        "log_endpoint": os.getenv("PANOPTICON_LOG_URL"),
        "trace_endpoint": os.getenv("PANOPTICON_TRACE_URL"),
        "environment": os.getenv("PANOPTICON_ENV"),
    },
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log validation errors for debugging"""
    body = await request.body()
    logger.error(f"Validation error for request: {body.decode()}")
    logger.error(f"Validation errors: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://demo-service-two.vercel.app",
        "https://qna.jungle-panopticon.cloud",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, tags=["chat"])
app.include_router(analytics.router, tags=["analytics"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "LLM Backend is running",
        "model": "Claude 3 Sonnet (AWS Bedrock)",
    }


@app.get("/test-logs")
async def test_logs():
    """로그 테스트 엔드포인트 - 다양한 레벨의 로그를 생성합니다"""

    return {
        "status": "ok",
        "message": "로그 테스트 완료! Panopticon Producer에서 확인하세요.",
        "logs_sent": ["INFO", "WARNING", "ERROR"],
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 5000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
