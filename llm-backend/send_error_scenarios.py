"""
Producer로 에러 시나리오 직접 전송
- 분당 8개 (7.5초마다 1개)
- chat/ask Bedrock 7번 재시도 후 실패
"""

import asyncio
import httpx
import uuid
import random
from datetime import datetime, timezone


# Producer 설정
PRODUCER_LOG_URL = "https://api.jungle-panopticon.cloud/producer/sdk/logs"
PRODUCER_TRACE_URL = "https://api.jungle-panopticon.cloud/producer/sdk/traces"
API_KEY = "yesyes"

# 서비스 설정
SERVICE_NAME = "LLM-Backend"
ENVIRONMENT = "Production"
BASE_URL = "https://qna.jungle-panopticon.cloud"


def generate_trace_id() -> str:
    """16바이트 hex trace ID 생성"""
    return uuid.uuid4().hex


def generate_span_id() -> str:
    """8바이트 hex span ID 생성"""
    return uuid.uuid4().hex[:16]


def create_error_scenario():
    """chat/ask 에러 시나리오 생성 (7번 재시도)"""
    trace_id = generate_trace_id()
    root_span_id = generate_span_id()
    conversation_id = str(uuid.uuid4())

    # 시작 시간
    start_time = datetime.now(timezone.utc)

    # 로그 데이터 생성
    logs = []

    # 1. 요청 시작 로그
    logs.append(
        {
            "type": "log",
            "timestamp": start_time.isoformat().replace("+00:00", "Z"),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "level": "info",
            "message": f"Ask request: conversationId={conversation_id}, question=로그 수집에 대해 알려주세요...",
            "context": "app.routers.chat",
            "trace": None,
            "trace_id": trace_id,
        }
    )

    # 2-7. 재시도 로그 (warning)
    for i in range(1, 8):
        retry_time = start_time.timestamp() + (i * 5)  # 5초씩 간격
        answer_length = random.randint(1010, 2000)
        logs.append(
            {
                "type": "log",
                "timestamp": datetime.fromtimestamp(retry_time, timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "service_name": SERVICE_NAME,
                "environment": ENVIRONMENT,
                "level": "warn",
                "message": f"시도 {i}/78] 응답 길이 초과: {answer_length}자 > 1000자",
                "context": "app.services.bedrock_service",
                "trace": None,
                "trace_id": trace_id,
            }
        )

    # 8. 최종 실패 로그 (error)
    final_time = start_time.timestamp() + 35
    logs.append(
        {
            "type": "log",
            "timestamp": datetime.fromtimestamp(final_time, timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "level": "error",
            "message": "최대 재시도 횟수(8번) 초과로 인한 오류 발생",
            "context": "app.services.bedrock_service",
            "trace": None,
            "trace_id": trace_id,
        }
    )

    # 트레이스 데이터 생성
    spans = []

    # 1. ROOT span (POST /llm/chat/ask) - ERROR
    spans.append(
        {
            "type": "span",
            "timestamp": start_time.isoformat().replace("+00:00", "Z"),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "trace_id": trace_id,
            "span_id": root_span_id,
            "parent_span_id": None,
            "name": "POST /llm/chat/ask",
            "kind": "SERVER",
            "duration_ms": 35000.0 + random.uniform(-500, 500),  # ~35초
            "status": "ERROR",
            "http_method": "POST",
            "http_path": "/llm/chat/ask",
            "http_url": f"{BASE_URL}/llm/chat/ask",
            "http_status_code": 502,
        }
    )

    # 2-8. Bedrock invoke spans (7개) - OK (각 호출 자체는 성공)
    cumulative_time = 0
    for i in range(1, 8):
        invoke_duration = random.uniform(4000, 5000)  # 4~5초
        invoke_start_time = start_time.timestamp() + cumulative_time

        spans.append(
            {
                "type": "span",
                "timestamp": datetime.fromtimestamp(invoke_start_time, timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "service_name": SERVICE_NAME,
                "environment": ENVIRONMENT,
                "trace_id": trace_id,
                "span_id": generate_span_id(),
                "parent_span_id": root_span_id,
                "name": "Bedrock InvokeModel",
                "kind": "CLIENT",
                "duration_ms": invoke_duration,
                "status": "OK",
                "bedrock_model_id": "anthropic.claude-3-haiku-20240307-v1:0",
                "bedrock_operation": "InvokeModel",
                "bedrock_input_tokens": random.randint(300, 400),
                "bedrock_output_tokens": random.randint(50, 100),
            }
        )

        cumulative_time += invoke_duration / 1000  # ms to seconds

    return logs, spans


async def send_to_producer(logs, spans):
    """Producer로 로그와 트레이스 전송"""
    headers = {"Content-Type": "application/json", "X-API-Key": API_KEY}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 로그 전송
            log_response = await client.post(
                PRODUCER_LOG_URL, json=logs, headers=headers
            )
            print(f"✅ 로그 전송 완료: {log_response.status_code} ({len(logs)}개 로그)")

            # 트레이스 전송
            trace_response = await client.post(
                PRODUCER_TRACE_URL, json=spans, headers=headers
            )
            print(
                f"✅ 트레이스 전송 완료: {trace_response.status_code} ({len(spans)}개 span)"
            )

        except Exception as e:
            print(f"❌ 전송 실패: {e}")


async def main():
    """분당 8개 (7.5초마다 1개) 에러 시나리오 전송"""
    print("🚀 에러 시나리오 전송 시작 (분당 8개)")
    print("   Ctrl+C로 종료하세요\n")

    count = 0
    try:
        while True:
            count += 1
            print(f"\n[{count}번째] 에러 시나리오 생성 중...")

            # 에러 시나리오 생성
            logs, spans = create_error_scenario()

            # Producer로 전송
            await send_to_producer(logs, spans)

            # 7.5초 대기 (분당 8개)
            print("⏳ 7.5초 대기 중...\n")
            await asyncio.sleep(7.5)

    except KeyboardInterrupt:
        print(f"\n\n⛔ 종료됨. 총 {count}개 에러 시나리오 전송 완료.")


if __name__ == "__main__":
    asyncio.run(main())
