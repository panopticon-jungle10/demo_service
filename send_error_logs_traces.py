"""
에러 시나리오 로그/트레이스 전송 스크립트

Panopticon 엔드포인트에 Bedrock 에러 상황의 로그와 트레이스를 전송합니다.
각 Bedrock InvokeModel의 duration_ms를 다양하게 생성합니다.
"""

import os
import json
import uuid
import random
import time
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any


class ErrorScenarioGenerator:
    """Bedrock 에러 시나리오 로그/트레이스 생성기"""

    def __init__(self, log_url: str, trace_url: str, api_key: str):
        self.log_url = log_url
        self.trace_url = trace_url
        self.api_key = api_key
        self.service_name = "LLM-Backend-local"
        self.environment = "Development"

    def generate_trace_id(self) -> str:
        """32자 hex trace ID 생성"""
        return uuid.uuid4().hex

    def generate_span_id(self) -> str:
        """16자 hex span ID 생성"""
        return uuid.uuid4().hex[:16]

    def send_logs(self, logs: List[Dict[str, Any]]) -> bool:
        """로그 데이터 전송"""
        try:
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            response = requests.post(self.log_url, json=logs, headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"✓ Logs sent successfully: {len(logs)} logs")
                return True
            else:
                print(f"✗ Failed to send logs: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error sending logs: {e}")
            return False

    def send_traces(self, spans: List[Dict[str, Any]]) -> bool:
        """트레이스 데이터 전송"""
        try:
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            response = requests.post(self.trace_url, json=spans, headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"✓ Traces sent successfully: {len(spans)} spans")
                return True
            else:
                print(f"✗ Failed to send traces: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error sending traces: {e}")
            return False

    def generate_bedrock_error_scenario(self) -> tuple:
        """
        Bedrock 에러 시나리오 생성

        - 3번 재시도 (각각 duration_ms가 다름: 2.5초~2.9초 범위)
        - 총 duration: 약 9초대
        - trace_id는 각 사이클마다 다름
        - span_id는 각 span마다 다름
        """
        trace_id = self.generate_trace_id()
        base_time = datetime.now(timezone.utc)

        # Span IDs
        server_span_id = self.generate_span_id()
        bedrock_span_ids = [
            self.generate_span_id(),  # 첫 번째 시도
            self.generate_span_id(),  # 두 번째 시도
            self.generate_span_id(),  # 세 번째 시도
        ]

        # 각 Bedrock InvokeModel의 duration을 2초 후반대로 다양하게 생성
        bedrock_durations = [
            random.uniform(2500, 2900),  # 2.5~2.9초
            random.uniform(2500, 2900),  # 2.5~2.9초
            random.uniform(2500, 2900),  # 2.5~2.9초
        ]

        # 재시도 간 간격 (매우 짧음, 약 10-30ms)
        retry_gaps = [
            random.uniform(10, 30),
            random.uniform(10, 30),
        ]

        # 총 duration 계산
        total_bedrock_time = sum(bedrock_durations) + sum(retry_gaps)
        # 추가 오버헤드 (에러 처리, 로깅 등)
        overhead = random.uniform(50, 150)
        total_duration = total_bedrock_time + overhead

        # 타임스탬프 계산 (역순으로 계산)
        current_time = base_time.timestamp()
        server_start_time = current_time

        # 첫 번째 Bedrock 호출 시작
        bedrock_1_start = server_start_time + (overhead / 2000)  # 약간의 초기 오버헤드
        bedrock_1_end = bedrock_1_start + (bedrock_durations[0] / 1000)

        # 두 번째 Bedrock 호출 시작 (첫 번째 종료 + gap)
        bedrock_2_start = bedrock_1_end + (retry_gaps[0] / 1000)
        bedrock_2_end = bedrock_2_start + (bedrock_durations[1] / 1000)

        # 세 번째 Bedrock 호출 시작 (두 번째 종료 + gap)
        bedrock_3_start = bedrock_2_end + (retry_gaps[1] / 1000)
        bedrock_3_end = bedrock_3_start + (bedrock_durations[2] / 1000)

        # Timestamps를 ISO 8601 형식으로 변환
        def to_iso(timestamp):
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace('+00:00', 'Z')

        server_timestamp = to_iso(server_start_time)
        bedrock_1_timestamp = to_iso(bedrock_1_start)
        bedrock_2_timestamp = to_iso(bedrock_2_start)
        bedrock_3_timestamp = to_iso(bedrock_3_start)
        error_log_timestamp = to_iso(bedrock_3_end + 0.01)  # 마지막 실패 직후

        # Logs 생성
        logs = [
            {
                "type": "log",
                "timestamp": error_log_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "error",
                "message": "Bedrock failed: 일시적인 오류가 발생했습니다. 다시 질문해주세요",
                "context": "app.routers.chat",
                "trace": None,
                "trace_id": trace_id
            }
        ]

        # Spans 생성 (순서: Bedrock 3개 → Server 1개)
        spans = [
            # 첫 번째 Bedrock 시도
            {
                "type": "span",
                "timestamp": bedrock_1_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
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
            # 두 번째 Bedrock 시도
            {
                "type": "span",
                "timestamp": bedrock_2_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
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
            # 세 번째 Bedrock 시도
            {
                "type": "span",
                "timestamp": bedrock_3_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
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
            # 서버 span (부모)
            {
                "type": "span",
                "timestamp": server_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
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

        # 요약 정보 출력
        print(f"  trace_id: {trace_id[:16]}...")
        print(f"  Bedrock 1: {bedrock_durations[0]:.2f}ms")
        print(f"  Bedrock 2: {bedrock_durations[1]:.2f}ms")
        print(f"  Bedrock 3: {bedrock_durations[2]:.2f}ms")
        print(f"  Total: {total_duration:.2f}ms")

        return logs, spans

    def run_continuous(self, interval: float = 5.0, count: int = None):
        """
        지속적으로 에러 시나리오 로그/트레이스 생성 및 전송

        Args:
            interval: 전송 간격 (초) - 에러는 드물게 발생하므로 기본 5초
            count: 전송 횟수 (None이면 무한)
        """
        iteration = 0
        print(f"Starting error scenario generation (interval: {interval}s)...")
        print(f"Log URL: {self.log_url}")
        print(f"Trace URL: {self.trace_url}\n")

        try:
            while count is None or iteration < count:
                print(f"[{iteration + 1}] Generating Bedrock error scenario:")

                logs, spans = self.generate_bedrock_error_scenario()

                # 전송
                self.send_logs(logs)
                self.send_traces(spans)
                print()

                iteration += 1
                if count is None or iteration < count:
                    time.sleep(interval)

        except KeyboardInterrupt:
            print("\nStopped by user")

        print(f"\nTotal sent: {iteration} error scenarios")


def main():
    # 환경 변수에서 URL과 API 키 가져오기
    log_url = os.getenv("PANOPTICON_LOG_URL", "http://localhost:8000/logs")
    trace_url = os.getenv("PANOPTICON_TRACE_URL", "http://localhost:8000/traces")
    api_key = os.getenv("PANOPTICON_API_KEY", "your-api-key")

    print("=" * 60)
    print("Error Scenario Log/Trace Generator")
    print("=" * 60)
    print(f"Log URL: {log_url}")
    print(f"Trace URL: {trace_url}")
    print(f"API Key: {api_key[:10]}..." if len(api_key) > 10 else api_key)
    print("=" * 60)
    print()

    generator = ErrorScenarioGenerator(log_url, trace_url, api_key)

    # 지속적으로 실행 (Ctrl+C로 중지)
    # 에러는 드물게 발생하므로 5초 간격
    generator.run_continuous(interval=5.0)


if __name__ == "__main__":
    main()
