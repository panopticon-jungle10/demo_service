from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
import json
import os
from typing import Optional

router = APIRouter(prefix="/generate", tags=["bedrock"])


class QuestionRequest(BaseModel):
    question: str
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7


class AnswerResponse(BaseModel):
    answer: str
    model: str


def get_bedrock_client():
    """AWS Bedrock Runtime 클라이언트 생성"""
    region = os.getenv("AWS_REGION", "us-east-1")

    session_kwargs = {"region_name": region}

    if os.getenv("AWS_PROFILE"):
        session_kwargs["profile_name"] = os.getenv("AWS_PROFILE")
    elif os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
        session_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
        session_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")

    session = boto3.Session(**session_kwargs)
    return session.client("bedrock-runtime")


@router.post("", response_model=AnswerResponse)
async def generate_answer(request: QuestionRequest):
    """
    AWS Bedrock Claude 3 Sonnet을 사용하여 질문에 대한 답변 생성
    """
    try:
        bedrock_client = get_bedrock_client()

        model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

        prompt = f"""당신은 로그 수집 서비스에 대한 전문가입니다.
사용자의 질문에 대해 정확하고 자세한 답변을 제공해주세요.

질문: {request.question}

답변:"""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })

        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=body
        )

        response_body = json.loads(response["body"].read())
        answer_text = response_body["content"][0]["text"]

        return AnswerResponse(
            answer=answer_text,
            model=model_id
        )

    except Exception as e:
        print(f"Error calling Bedrock: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating answer: {str(e)}"
        )
