import json
import os
import logging
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load .env as early as possible
load_dotenv()

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "ap-northeast-2")
        # Claude 3 Haiku 모델 ID
        # 참고: 일부 리전에서는 `:0` 없이 사용해야 할 수 있습니다
        # 예: "anthropic.claude-3-haiku-20240307-v1:0" 또는 "anthropic.claude-3-haiku-20240307-v1"
        self.model_id = os.getenv(
            "AWS_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"
        )
        self.use_mock = os.getenv("USE_MOCK_AI", "false").lower() == "true"

        if not self.use_mock:
            aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
            aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

            if not aws_access_key or not aws_secret_key:
                logger.error("액세스 키 또는 시크릿 키가 존재하지 않습니다.")
                raise ValueError("액세스 키 또는 시크릿 키가 존재하지 않습니다.")

            try:
                self.client = boto3.client(
                    "bedrock-runtime",
                    region_name=self.region,
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key,
                )
                logger.info(f"베드락 승인 성공 (region: {self.region})")
            except Exception as e:
                logger.error(f"베드락 승인 실패: {e}")
                raise RuntimeError(e)

        else:
            self.client = None
            logger.info("Mock 모드로 실행")

        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Load system prompt from system_prompt.txt"""
        prompt_path = Path(__file__).parent.parent.parent / "system_prompt.txt"
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                logger.info("Bedrock 파일 읽기 성공")
                return f.read()
        except Exception as e:
            logger.error(f"파일 읽기를 실패했습니다. {e}")
            return "당신은 로그 수집 서비스 전문가입니다."

    # Mock 모드로 대답하기
    async def generate_answer(self, question: str) -> str:
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

        try:
            # Claude 3 Haiku API 형식에 맞게 요청 본문 구성
            body = json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 2048,
                    "temperature": 0.4,
                    "system": self.system_prompt,
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": question}],
                        }
                    ],
                }
            )

            logger.debug(
                f"Bedrock 요청 - Model: {self.model_id}, Region: {self.region}"
            )
            logger.debug(f"요청 본문: {body[:500]}")

            # body를 bytes로 변환하여 전달
            response = self.client.invoke_model(
                modelId=self.model_id, body=body.encode("utf-8")
            )

            # 응답 본문 읽기
            response_body_bytes = response["body"].read()

            # 빈 응답 체크
            if not response_body_bytes:
                logger.error("Bedrock 응답이 비어있습니다.")
                raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")

            # 디버깅을 위해 응답 내용 로깅
            response_body_str = response_body_bytes.decode("utf-8")
            logger.info(f"Bedrock 응답 수신 (길이: {len(response_body_str)} bytes)")
            logger.debug(f"Bedrock 응답 (처음 500자): {response_body_str[:500]}")

            # JSON 파싱
            try:
                response_body = json.loads(response_body_str)
            except json.JSONDecodeError as json_err:
                logger.error(f"JSON 파싱 실패. 에러: {json_err}")
                logger.error(f"응답 내용 (전체): {response_body_str}")
                raise Exception(f"응답 파싱 오류: {json_err}")

            # 응답 구조 확인
            if "content" not in response_body or not response_body["content"]:
                logger.error(f"예상하지 못한 응답 구조: {response_body}")
                raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")

            answer = response_body["content"][0]["text"]

            return answer

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_message = e.response.get("Error", {}).get("Message", str(e))
            logger.error(
                f"Bedrock ClientError - Code: {error_code}, Message: {error_message}",
                exc_info=True,
            )
            logger.error(f"모델 ID: {self.model_id}, 리전: {self.region}")
            raise Exception(f"AWS Bedrock 오류 ({error_code}): {error_message}")
        except Exception as e:
            logger.error(f"Bedrock error: {e}", exc_info=True)
            logger.error(f"모델 ID: {self.model_id}, 리전: {self.region}")
            raise Exception("일시적인 오류가 발생했습니다. 다시 질문해주세요")
