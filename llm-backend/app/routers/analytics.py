"""
분석 엔드포인트 - 트레이스 시연용
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter()

analytics_service = AnalyticsService()


@router.post("/analytics/track")
async def track_user_behavior(
    user_id: str = Query(..., description="사용자 ID"),
    action: str = Query(..., description="수행한 액션 (예: 'view_post', 'create_comment')"),
):
    """
    사용자 행동 추적 엔드포인트

    외부 분석 API를 호출하여 사용자 행동을 기록합니다.
    - 트레이스 span 생성됨
    - 로그 수집됨
    """
    logger.info(f"사용자 행동 추적 요청: user_id={user_id}, action={action}")

    try:
        result = await analytics_service.track_user_behavior(user_id, action)
        return {
            "status": "success",
            "message": "사용자 행동이 성공적으로 추적되었습니다.",
            "data": result,
        }
    except Exception as e:
        logger.error(f"사용자 행동 추적 실패: {e}")
        raise HTTPException(status_code=500, detail="행동 추적 중 오류가 발생했습니다.")


@router.get("/analytics/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """
    AI 추천 조회 엔드포인트

    사용자 맞춤 콘텐츠 추천을 제공합니다.
    - 외부 추천 엔진 API 호출 시뮬레이션
    - 트레이스 span 생성됨
    """
    logger.info(f"AI 추천 조회 요청: user_id={user_id}")

    try:
        recommendations = await analytics_service.get_recommendations(user_id)
        logger.info(f"추천 결과 반환: {len(recommendations)}개")

        return {
            "status": "success",
            "user_id": user_id,
            "recommendations": recommendations,
            "total": len(recommendations),
        }
    except Exception as e:
        logger.error(f"AI 추천 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="추천 조회 중 오류가 발생했습니다.")


@router.get("/analytics/metrics/{service_name}")
async def get_service_metrics(service_name: str):
    """
    서비스 메트릭 조회 엔드포인트

    특정 서비스의 성능 메트릭을 계산하여 반환합니다.
    - 내부 데이터 처리 + 외부 메트릭 저장소 조회 시뮬레이션
    - 복수의 트레이스 span 생성됨
    """
    logger.info(f"서비스 메트릭 조회 요청: service={service_name}")

    try:
        metrics = await analytics_service.calculate_metrics(service_name)
        logger.info(f"메트릭 조회 완료: service={service_name}")

        return {
            "status": "success",
            "service_name": service_name,
            "metrics": metrics,
            "timestamp": "2025-01-01T00:00:00Z",
        }
    except Exception as e:
        logger.error(f"메트릭 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="메트릭 조회 중 오류가 발생했습니다.")
