import json
import os
import logging
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        self.client = boto3.client("bedrock-runtime", region_name=self.region)
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Load system prompt from system_prompt.txt"""
        prompt_path = Path(__file__).parent.parent.parent / "system_prompt.txt"
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to load system_prompt.txt: {e}")
            return "당신은 로그 수집 서비스 전문가입니다."

    async def generate_answer(self, question: str) -> str:
        """
        Call AWS Bedrock Claude 3 Sonnet to generate answer
        """
        try:
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2048,
                "temperature": 0.7,
                "system": self.system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            })

            response = self.client.invoke_model(
                modelId=self.model_id,
                body=body
            )

            response_body = json.loads(response["body"].read())
            answer = response_body["content"][0]["text"]

            return answer

        except ClientError as e:
            logger.error(f"Bedrock ClientError: {e}", exc_info=True)
            raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")
        except Exception as e:
            logger.error(f"Bedrock error: {e}", exc_info=True)
            raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")
