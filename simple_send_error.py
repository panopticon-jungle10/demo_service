#!/usr/bin/env python3
"""
에러 시나리오 간단 전송 스크립트

Panopticon에 Bedrock 에러 로그/트레이스를 직접 전송합니다.
환경 변수 설정 없이 바로 실행 가능합니다.
"""

import json
import uuid
import random
import time
import requests
from datetime import datetime, timezone


# 하드코딩된 URL
LOG_URL = "https://api.jungle-panopticon.cloud/producer/sdk/logs"
TRACE_URL = "https://api.jungle-panopticon.cloud/producer/sdk/traces"
API_KEY = "jungle-panopticon-2025"  # 실제 API 키로 변경하세요

SERVICE_NAME = "LLM-Backend-local"
ENVIRONMENT = "Development"


def generate_trace_id():
    """32자 hex trace ID 생성"""
    return uuid.uuid4().hex


def generate_span_id():
    """16자 hex span ID 생성"""
    return uuid.uuid4().hex[:16]


def send_data(url, data):
    """데이터 전송"""
    try:
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        }
        response = requests.post(url, json=data, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✓ Sent to {url.split('/')[-1]}: {len(data)} items")
            return True
        else:
            print(f"✗ Failed ({response.status_code}): {response.text[:100]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def generate_error_scenario():
    """Bedrock 에러 시나리오 생성"""
    trace_id = generate_trace_id()
    base_time = datetime.now(timezone.utc)

    # Span IDs
    server_span_id = generate_span_id()
    bedrock_span_ids = [generate_span_id() for _ in range(3)]

    # 각 Bedrock 호출의 duration을 2.5~2.9초 범위에서 다양하게
    bedrock_durations = [
        random.uniform(2500, 2900),
        random.uniform(2500, 2900),
        random.uniform(2500, 2900),
    ]

    # 재시도 간 간격
    retry_gaps = [random.uniform(10, 30), random.uniform(10, 30)]

    # 총 duration
    total_duration = sum(bedrock_durations) + sum(retry_gaps) + random.uniform(50, 150)

    # 타임스탬프 계산
    server_start = base_time.timestamp()
    bedrock_1_start = server_start + 0.025
    bedrock_1_end = bedrock_1_start + (bedrock_durations[0] / 1000)
    bedrock_2_start = bedrock_1_end + (retry_gaps[0] / 1000)
    bedrock_2_end = bedrock_2_start + (bedrock_durations[1] / 1000)
    bedrock_3_start = bedrock_2_end + (retry_gaps[1] / 1000)
    bedrock_3_end = bedrock_3_start + (bedrock_durations[2] / 1000)

    def to_iso(ts):
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace('+00:00', 'Z')

    # 로그 생성
    logs = [
        {
            "type": "log",
            "timestamp": to_iso(bedrock_3_end + 0.01),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "level": "error",
            "message": "Bedrock failed: 일시적인 오류가 발생했습니다. 다시 질문해주세요",
            "context": "app.routers.chat",
            "trace": None,
            "trace_id": trace_id
        }
    ]

    # 트레이스 생성
    spans = [
        # Bedrock 1
        {
            "type": "span",
            "timestamp": to_iso(bedrock_1_start),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "trace_id": trace_id,
            "span_id": bedrock_span_ids[0],
            "parent_span_id": server_span_id,
            "name": "Bedrock InvokeModel",
            "kind": "CLIENT",
            "duration_ms": round(bedrock_durations[0], 2),
            "status": "ERROR",
            "bedrock_model_id": "invalid-model",
            "bedrock_operation": "InvokeModel",
            "bedrock_input_tokens": None,
            "bedrock_output_tokens": None
        },
        # Bedrock 2
        {
            "type": "span",
            "timestamp": to_iso(bedrock_2_start),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "trace_id": trace_id,
            "span_id": bedrock_span_ids[1],
            "parent_span_id": server_span_id,
            "name": "Bedrock InvokeModel",
            "kind": "CLIENT",
            "duration_ms": round(bedrock_durations[1], 2),
            "status": "ERROR",
            "bedrock_model_id": "invalid-model",
            "bedrock_operation": "InvokeModel",
            "bedrock_input_tokens": None,
            "bedrock_output_tokens": None
        },
        # Bedrock 3
        {
            "type": "span",
            "timestamp": to_iso(bedrock_3_start),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "trace_id": trace_id,
            "span_id": bedrock_span_ids[2],
            "parent_span_id": server_span_id,
            "name": "Bedrock InvokeModel",
            "kind": "CLIENT",
            "duration_ms": round(bedrock_durations[2], 2),
            "status": "ERROR",
            "bedrock_model_id": "invalid-model",
            "bedrock_operation": "InvokeModel",
            "bedrock_input_tokens": None,
            "bedrock_output_tokens": None
        },
        # Server span
        {
            "type": "span",
            "timestamp": to_iso(server_start),
            "service_name": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "trace_id": trace_id,
            "span_id": server_span_id,
            "parent_span_id": None,
            "name": "POST /llm/chat",
            "kind": "SERVER",
            "duration_ms": round(total_duration, 2),
            "status": "ERROR",
            "http_method": "POST",
            "http_path": "/llm/chat",
            "http_url": "https://qna-api.jungle-panopticon.cloud/llm/chat",
            "http_status_code": 502
        }
    ]

    print(f"  trace_id: {trace_id[:16]}...")
    print(f"  Bedrock 1: {bedrock_durations[0]:.2f}ms")
    print(f"  Bedrock 2: {bedrock_durations[1]:.2f}ms")
    print(f"  Bedrock 3: {bedrock_durations[2]:.2f}ms")
    print(f"  Total: {total_duration:.2f}ms")

    return logs, spans


def main():
    print("=" * 60)
    print("Bedrock Error Scenario Sender")
    print("=" * 60)
    print(f"Log URL: {LOG_URL}")
    print(f"Trace URL: {TRACE_URL}")
    print("=" * 60)
    print()

    count = 0
    try:
        while True:
            count += 1
            print(f"\n[{count}] Generating error scenario:")

            logs, spans = generate_error_scenario()

            # 전송
            send_data(LOG_URL, logs)
            send_data(TRACE_URL, spans)

            print(f"  Waiting 5 seconds...")
            time.sleep(5)

    except KeyboardInterrupt:
        print(f"\n\nStopped. Total sent: {count} scenarios")


if __name__ == "__main__":
    main()
