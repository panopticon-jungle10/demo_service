import json
import os
import logging
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import asyncio
import random
import httpx

# Load .env as early as possible
load_dotenv()

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "ap-northeast-2")
        self.model_id = os.getenv(
            "AWS_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"
        )
        self.use_mock = os.getenv("USE_MOCK_AI", "false").lower() == "true"

        if not self.use_mock:
            aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
            aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

            if not aws_access_key or not aws_secret_key:
                error_msg = (
                    "AWS credentials not found! Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY "
                    "in .env file, or set USE_MOCK_AI=true for testing."
                )
                logger.error(error_msg)
                raise ValueError(error_msg)

            try:
                self.client = boto3.client(
                    "bedrock-runtime",
                    region_name=self.region,
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key,
                )
                logger.info(
                    f"베드락 client initialized with credentials from environment variables (region: {self.region})"
                )
            except Exception as e:
                error_msg = f"Failed to initialize Bedrock client: {e}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
        else:
            self.client = None
            logger.info("Running in MOCK mode - no AWS credentials needed")

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

    async def _simulate_bedrock_call(self) -> str:
        """
        시연용: Bedrock 호출 시뮬레이션 (트레이스 span 생성)
        실제 Bedrock은 호출하지 않고, httpx로 여러 더미 요청하여 복수 span 생성
        1000자 초과 응답을 반환하여 재시도 유발
        """
        RANDOM_LENGTH = random.randint(1100, 1300)

        # bedrock 3번 호출 (각각 span 생성)
        for i in range(1, 4):
            if self.client:
                try:
                    self.client.invoke_model(
                        modelId="invalid-model",
                        body=json.dumps({"test": f"attempt_call_{i}"}),
                    )
                    logger.info(f"[시도 {i}] Bedrock 호출")
                    logger.error(
                        f"1000자 초과했습니다. 응답 길이: {len(RANDOM_LENGTH)}자."
                    )

                except:
                    pass
            await asyncio.sleep(3)
        # 무조건 에러발생
        raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")

    async def generate_answer(self, question: str, is_error: bool = False) -> str:
        """
        Call AWS Bedrock Claude 3 Sonnet to generate answer

        Args:
            question: 사용자 질문
            is_error: True면 에러 시나리오 시연 (1000자 초과 -> 5번 재시도 -> 실패)
        """

        # 에러 시나리오 시연
        if is_error:

            logger.info("call AI")

            # 실제 호출은 하지 않고 트레이스만 생성 (각 시도마다 3개 span)
            answer = await self._simulate_bedrock_call()

            # 성공 (에러 시나리오에서는 절대 도달 안함)
            return answer

        # Mock mode for local testing (정상 시나리오)
        if self.use_mock:
            logger.info(f"MOCK AI - Question: {question}")
            return f"""안녕하세요! 로그 수집 서비스에 대한 질문에 답변드리겠습니다.

                    질문: {question}

                    로그 수집은 시스템의 다양한 이벤트와 정보를 기록하고 중앙화하는 프로세스입니다. 주요 이점은 다음과 같습니다:

                    1. **문제 진단**: 시스템 오류 발생 시 로그를 분석하여 원인을 파악할 수 있습니다.
                    2. **성능 모니터링**: 애플리케이션의 성능 지표를 추적하고 최적화할 수 있습니다.
                    3. **보안 감사**: 보안 이벤트를 기록하고 분석하여 위협을 탐지할 수 있습니다.
                    4. **규정 준수**: 법적 요구사항을 충족하기 위한 감사 로그를 유지할 수 있습니다.

                    추가 질문이 있으시면 언제든지 문의해주세요!

                    (참고: 현재 MOCK 모드로 실행 중입니다)"""

        # 실제 Bedrock 호출 (정상 시나리오)
        try:
            body = json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 2048,
                    "temperature": 0.4,
                    "system": self.system_prompt,
                    "messages": [{"role": "user", "content": question}],
                }
            )

            response = self.client.invoke_model(modelId=self.model_id, body=body)

            response_body = json.loads(response["body"].read())
            answer = response_body["content"][0]["text"]

            return answer

        except ClientError as e:
            logger.error(f"Bedrock ClientError: {e}", exc_info=True)
            raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")
        except Exception as e:
            logger.error(f"Bedrock error: {e}", exc_info=True)
            raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")
