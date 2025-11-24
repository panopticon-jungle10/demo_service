"""
정상 트래픽 로그/트레이스 전송 스크립트

Panopticon 엔드포인트에 정상적인 로그와 트레이스 데이터를 전송합니다.
자연스러운 duration_ms와 타임스탬프를 생성합니다.
"""

import os
import json
import uuid
import random
import time
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any


class NormalTrafficGenerator:
    """정상 트래픽 로그/트레이스 생성기"""

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

    def get_current_timestamp(self) -> str:
        """현재 시간을 ISO 8601 형식으로 반환"""
        return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

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

    def generate_llm_chat_success(self, with_post: bool = False) -> tuple:
        """정상적인 /llm/chat 호출 로그와 트레이스 생성"""
        trace_id = self.generate_trace_id()
        base_time = datetime.now(timezone.utc)

        # Span IDs
        server_span_id = self.generate_span_id()
        bedrock_span_id = self.generate_span_id()

        # Duration (정상 케이스: Bedrock 1-3초, 전체 요청 조금 더)
        bedrock_duration = random.uniform(1000, 3000)  # 1-3초
        bedrock_start = base_time.timestamp()
        bedrock_end = bedrock_start + (bedrock_duration / 1000)

        if with_post:
            # 글 작성 포함 시 추가 시간 (API 백엔드 호출)
            total_duration = bedrock_duration + random.uniform(300, 800)  # +300-800ms
        else:
            total_duration = bedrock_duration + random.uniform(50, 200)  # +50-200ms

        # Timestamps
        bedrock_timestamp = datetime.fromtimestamp(bedrock_start, tz=timezone.utc).isoformat().replace('+00:00', 'Z')
        server_timestamp = datetime.fromtimestamp(bedrock_start - 0.05, tz=timezone.utc).isoformat().replace('+00:00', 'Z')

        # Logs
        logs = [
            {
                "type": "log",
                "timestamp": server_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": f"POST /llm/chat request received",
                "context": "app.routers.chat",
                "trace": None,
                "trace_id": trace_id
            },
            {
                "type": "log",
                "timestamp": bedrock_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": "Bedrock request completed successfully",
                "context": "app.services.bedrock_service",
                "trace": None,
                "trace_id": trace_id
            }
        ]

        # Spans
        spans = [
            {
                "type": "span",
                "timestamp": bedrock_timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "trace_id": trace_id,
                "span_id": bedrock_span_id,
                "parent_span_id": server_span_id,
                "name": "Bedrock InvokeModel",
                "kind": "CLIENT",
                "duration_ms": round(bedrock_duration, 2),
                "status": "OK",
                "bedrock_model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
                "bedrock_operation": "InvokeModel",
                "bedrock_input_tokens": random.randint(50, 200),
                "bedrock_output_tokens": random.randint(100, 500)
            },
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
                "status": "OK",
                "http_method": "POST",
                "http_path": "/llm/chat",
                "http_url": "https://qna-api.jungle-panopticon.cloud/llm/chat",
                "http_status_code": 200
            }
        ]

        if with_post:
            # 글 작성 시 추가 로그
            logs.append({
                "type": "log",
                "timestamp": datetime.fromtimestamp(bedrock_end + 0.1, tz=timezone.utc).isoformat().replace('+00:00', 'Z'),
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": "Post and comment created successfully",
                "context": "app.services.api_backend_service",
                "trace": None,
                "trace_id": trace_id
            })

        return logs, spans

    def generate_analytics_track_success(self) -> tuple:
        """정상적인 /llm/analytics/track 호출 로그와 트레이스 생성"""
        trace_id = self.generate_trace_id()
        span_id = self.generate_span_id()
        timestamp = self.get_current_timestamp()
        duration = random.uniform(50, 200)  # 50-200ms

        logs = [
            {
                "type": "log",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": "User behavior tracked successfully",
                "context": "app.routers.analytics",
                "trace": None,
                "trace_id": trace_id
            }
        ]

        spans = [
            {
                "type": "span",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "trace_id": trace_id,
                "span_id": span_id,
                "parent_span_id": None,
                "name": "POST /llm/analytics/track",
                "kind": "SERVER",
                "duration_ms": round(duration, 2),
                "status": "OK",
                "http_method": "POST",
                "http_path": "/llm/analytics/track",
                "http_url": "https://qna-api.jungle-panopticon.cloud/llm/analytics/track",
                "http_status_code": 200
            }
        ]

        return logs, spans

    def generate_analytics_recommendations_success(self) -> tuple:
        """정상적인 /llm/analytics/recommendations 호출 로그와 트레이스 생성"""
        trace_id = self.generate_trace_id()
        span_id = self.generate_span_id()
        timestamp = self.get_current_timestamp()
        duration = random.uniform(100, 400)  # 100-400ms

        logs = [
            {
                "type": "log",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": "Recommendations retrieved successfully",
                "context": "app.routers.analytics",
                "trace": None,
                "trace_id": trace_id
            }
        ]

        spans = [
            {
                "type": "span",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "trace_id": trace_id,
                "span_id": span_id,
                "parent_span_id": None,
                "name": "GET /llm/analytics/recommendations",
                "kind": "SERVER",
                "duration_ms": round(duration, 2),
                "status": "OK",
                "http_method": "GET",
                "http_path": "/llm/analytics/recommendations",
                "http_url": "https://qna-api.jungle-panopticon.cloud/llm/analytics/recommendations",
                "http_status_code": 200
            }
        ]

        return logs, spans

    def generate_analytics_metrics_success(self) -> tuple:
        """정상적인 /llm/analytics/metrics 호출 로그와 트레이스 생성"""
        trace_id = self.generate_trace_id()
        span_id = self.generate_span_id()
        timestamp = self.get_current_timestamp()
        duration = random.uniform(80, 300)  # 80-300ms

        logs = [
            {
                "type": "log",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "level": "info",
                "message": "Service metrics retrieved successfully",
                "context": "app.routers.analytics",
                "trace": None,
                "trace_id": trace_id
            }
        ]

        spans = [
            {
                "type": "span",
                "timestamp": timestamp,
                "service_name": self.service_name,
                "environment": self.environment,
                "trace_id": trace_id,
                "span_id": span_id,
                "parent_span_id": None,
                "name": "GET /llm/analytics/metrics",
                "kind": "SERVER",
                "duration_ms": round(duration, 2),
                "status": "OK",
                "http_method": "GET",
                "http_path": "/llm/analytics/metrics",
                "http_url": "https://qna-api.jungle-panopticon.cloud/llm/analytics/metrics",
                "http_status_code": 200
            }
        ]

        return logs, spans

    def run_continuous(self, interval: float = 0.2, count: int = None):
        """
        지속적으로 로그/트레이스 생성 및 전송

        Args:
            interval: 전송 간격 (초)
            count: 전송 횟수 (None이면 무한)
        """
        iteration = 0
        print(f"Starting normal traffic generation (interval: {interval}s)...")
        print(f"Log URL: {self.log_url}")
        print(f"Trace URL: {self.trace_url}\n")

        try:
            while count is None or iteration < count:
                # 엔드포인트 비율에 맞춰 생성 (8:3:3:2)
                endpoint_choice = random.choices(
                    ['chat', 'track', 'recommendations', 'metrics'],
                    weights=[8, 3, 3, 2]
                )[0]

                if endpoint_choice == 'chat':
                    # 30% 확률로 글 작성 포함
                    with_post = random.random() < 0.3
                    logs, spans = self.generate_llm_chat_success(with_post=with_post)
                    print(f"[{iteration + 1}] Generated: POST /llm/chat {'(with post)' if with_post else '(no post)'}")
                elif endpoint_choice == 'track':
                    logs, spans = self.generate_analytics_track_success()
                    print(f"[{iteration + 1}] Generated: POST /llm/analytics/track")
                elif endpoint_choice == 'recommendations':
                    logs, spans = self.generate_analytics_recommendations_success()
                    print(f"[{iteration + 1}] Generated: GET /llm/analytics/recommendations")
                else:  # metrics
                    logs, spans = self.generate_analytics_metrics_success()
                    print(f"[{iteration + 1}] Generated: GET /llm/analytics/metrics")

                # 전송
                self.send_logs(logs)
                self.send_traces(spans)
                print()

                iteration += 1
                if count is None or iteration < count:
                    time.sleep(interval)

        except KeyboardInterrupt:
            print("\nStopped by user")

        print(f"\nTotal sent: {iteration} requests")


def main():
    # 환경 변수에서 URL과 API 키 가져오기
    log_url = os.getenv("PANOPTICON_LOG_URL", "http://localhost:8000/logs")
    trace_url = os.getenv("PANOPTICON_TRACE_URL", "http://localhost:8000/traces")
    api_key = os.getenv("PANOPTICON_API_KEY", "your-api-key")

    print("=" * 60)
    print("Normal Traffic Log/Trace Generator")
    print("=" * 60)
    print(f"Log URL: {log_url}")
    print(f"Trace URL: {trace_url}")
    print(f"API Key: {api_key[:10]}..." if len(api_key) > 10 else api_key)
    print("=" * 60)
    print()

    generator = NormalTrafficGenerator(log_url, trace_url, api_key)

    # 지속적으로 실행 (Ctrl+C로 중지)
    # 1초마다 전송 = 분당 약 60회
    # 분당 300회를 원하면 interval=0.2 (5회/초)
    generator.run_continuous(interval=0.2)


if __name__ == "__main__":
    main()
