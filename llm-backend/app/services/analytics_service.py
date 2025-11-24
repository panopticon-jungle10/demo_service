"""
분석 서비스 - 더미 외부 API 호출 시뮬레이션
httpx를 사용하여 트레이스 span 생성
"""
import logging
import asyncio
import random
import httpx

logger = logging.getLogger(__name__)

# 더미 API 엔드포인트들 (실제로는 호출 실패하지만 span은 생성됨)
ANALYTICS_API_BASE = "https://analytics-api-mock.example.com"
RECOMMENDATION_API_BASE = "https://recommendation-engine-mock.example.com"
METRICS_API_BASE = "https://metrics-storage-mock.example.com"


class AnalyticsService:
    """사용자 행동 분석 서비스"""

    async def track_user_behavior(self, user_id: str, action: str):
        """
        사용자 행동 추적 - 외부 분석 API 호출 시뮬레이션
        httpx로 더미 요청하여 트레이스 span 생성
        """
        logger.info(f"사용자 행동 추적 시작: user_id={user_id}, action={action}")

        # httpx로 외부 API 호출 시뮬레이션 (SDK가 자동으로 span 생성)
        try:
            async with httpx.AsyncClient(timeout=0.3) as client:
                await client.post(
                    f"{ANALYTICS_API_BASE}/track",
                    json={"user_id": user_id, "action": action}
                )
        except Exception:
            # 실패는 예상된 동작 (span만 필요)
            pass

        # 더미 데이터 반환
        analytics_data = {
            "user_id": user_id,
            "action": action,
            "timestamp": "2025-01-01T00:00:00Z",
            "session_duration": random.randint(10, 300),
            "page_views": random.randint(1, 20),
        }

        logger.info(f"사용자 행동 추적 완료: {analytics_data}")
        return analytics_data

    async def get_recommendations(self, user_id: str):
        """
        AI 추천 엔진 - 외부 추천 API 호출 시뮬레이션
        httpx로 더미 요청하여 트레이스 span 생성
        """
        logger.info(f"AI 추천 조회 시작: user_id={user_id}")

        # httpx로 외부 추천 엔진 API 호출 시뮬레이션
        try:
            async with httpx.AsyncClient(timeout=0.5) as client:
                await client.get(
                    f"{RECOMMENDATION_API_BASE}/recommendations/{user_id}",
                    params={"limit": 3}
                )
        except Exception:
            # 실패는 예상된 동작 (span만 필요)
            pass

        recommendations = [
            {"id": 1, "title": "로그 수집 시스템 구축 가이드", "score": 0.95},
            {"id": 2, "title": "분산 추적의 이해", "score": 0.87},
            {"id": 3, "title": "모니터링 베스트 프랙티스", "score": 0.82},
        ]

        logger.info(f"AI 추천 조회 완료: {len(recommendations)}개 항목")
        return recommendations

    async def calculate_metrics(self, service_name: str):
        """
        서비스 메트릭 계산 - 내부 데이터 처리 + 외부 메트릭 저장소 호출 시뮬레이션
        복수의 httpx 호출로 여러 트레이스 span 생성
        """
        logger.info(f"메트릭 계산 시작: service={service_name}")

        # 1단계: 내부 데이터 처리 (간단한 계산)
        await asyncio.sleep(random.uniform(0.02, 0.05))
        logger.info("내부 데이터 처리 완료")

        # 2단계: 외부 메트릭 저장소에서 요청 카운트 조회 (span 1)
        try:
            async with httpx.AsyncClient(timeout=0.4) as client:
                await client.get(
                    f"{METRICS_API_BASE}/metrics/{service_name}/requests",
                    params={"period": "1h"}
                )
        except Exception:
            pass
        logger.info("요청 카운트 조회 완료")

        # 3단계: 외부 메트릭 저장소에서 에러율 조회 (span 2)
        try:
            async with httpx.AsyncClient(timeout=0.4) as client:
                await client.get(
                    f"{METRICS_API_BASE}/metrics/{service_name}/errors",
                    params={"period": "1h"}
                )
        except Exception:
            pass
        logger.info("에러율 조회 완료")

        # 4단계: 외부 메트릭 저장소에서 리소스 사용량 조회 (span 3)
        try:
            async with httpx.AsyncClient(timeout=0.4) as client:
                await client.get(
                    f"{METRICS_API_BASE}/metrics/{service_name}/resources",
                    params={"metrics": "cpu,memory"}
                )
        except Exception:
            pass
        logger.info("리소스 사용량 조회 완료")

        # 더미 메트릭 데이터 생성
        metrics = {
            "service_name": service_name,
            "request_count": random.randint(1000, 10000),
            "error_rate": round(random.uniform(0.01, 0.05), 4),
            "avg_response_time_ms": random.randint(50, 500),
            "p95_response_time_ms": random.randint(100, 800),
            "cpu_usage": round(random.uniform(20, 80), 2),
            "memory_usage_mb": random.randint(200, 1500),
        }

        logger.info(f"메트릭 계산 완료: error_rate={metrics['error_rate']}")
        return metrics
