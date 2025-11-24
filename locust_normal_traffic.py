"""
Locust 부하 테스트 - 정상 트래픽 시뮬레이션
자연스러운 사용자 흐름을 시뮬레이션합니다.

엔드포인트 비율:
- POST /llm/chat: 50% (비율 8/16, 이 중 30%는 글 작성, 70%는 글 작성 안함)
- POST /llm/analytics/track: 18.75% (비율 3/16)
- GET /llm/analytics/recommendations/{user_id}: 18.75% (비율 3/16)
- GET /llm/analytics/metrics/{service_name}: 12.5% (비율 2/16)
"""

import random
import uuid
from locust import HttpUser, task, between


class NormalTrafficUser(HttpUser):
    """정상적인 사용자 트래픽을 시뮬레이션하는 Locust 사용자"""

    # 자연스러운 사용자 행동을 위해 요청 간 1~3초 대기
    wait_time = between(1, 3)

    # 호스트는 명령줄에서 지정하거나 여기서 기본값 설정
    host = "https://qna-api.jungle-panopticon.cloud"

    def on_start(self):
        """사용자 세션 시작 시 실행"""
        # 각 사용자마다 고유한 ID와 conversation ID 생성
        self.user_id = f"user_{uuid.uuid4().hex[:8]}"
        self.conversation_id = str(uuid.uuid4())

        # 샘플 질문 리스트
        self.questions = [
            "AWS Lambda의 장점은 무엇인가요?",
            "FastAPI와 Django의 차이점을 설명해주세요.",
            "Docker 컨테이너와 가상머신의 차이는?",
            "CI/CD 파이프라인 구축 방법을 알려주세요.",
            "마이크로서비스 아키텍처의 장단점은?",
            "Kubernetes를 사용하는 이유는?",
            "RESTful API 설계 원칙은?",
            "GraphQL과 REST API 비교해주세요.",
            "서버리스 아키텍처란 무엇인가요?",
            "데이터베이스 인덱싱의 중요성은?"
        ]

        self.service_names = [
            "llm-backend",
            "api-backend",
            "frontend",
            "panopticon-producer",
            "panopticon-consumer"
        ]

        self.user_actions = [
            "view_post",
            "create_comment",
            "like_post",
            "share_post",
            "search",
            "filter_posts"
        ]

    @task(8)
    def chat_request(self):
        """
        POST /llm/chat 엔드포인트 호출 (비율: 8)
        30%는 글 작성, 70%는 글 작성 안함
        """
        question = random.choice(self.questions)
        wants_to_post = random.random() < 0.3  # 30% 확률로 글 작성

        payload = {
            "conversationId": self.conversation_id,
            "originalQuestion": question,
            "wantsToPost": wants_to_post,
            "isError": False
        }

        # 글 작성하는 경우 postData 추가
        if wants_to_post:
            is_anonymous = random.choice([True, False])
            payload["postData"] = {
                "title": f"질문: {question[:30]}...",
                "password": "test1234",
                "authorName": self.user_id if not is_anonymous else "익명",
                "isAnonymous": is_anonymous,
                "isPrivate": random.choice([True, False]),
                "email": f"{self.user_id}@example.com" if random.random() < 0.5 else None
            }

        with self.client.post(
            "/llm/chat",
            json=payload,
            catch_response=True,
            name="POST /llm/chat (with post)" if wants_to_post else "POST /llm/chat (no post)"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")

    @task(3)
    def track_user_behavior(self):
        """
        POST /llm/analytics/track 엔드포인트 호출 (비율: 3)
        사용자 행동 추적
        """
        action = random.choice(self.user_actions)

        with self.client.post(
            f"/llm/analytics/track?user_id={self.user_id}&action={action}",
            catch_response=True,
            name="POST /llm/analytics/track"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")

    @task(3)
    def get_recommendations(self):
        """
        GET /llm/analytics/recommendations/{user_id} 엔드포인트 호출 (비율: 3)
        AI 추천 조회
        """
        with self.client.get(
            f"/llm/analytics/recommendations/{self.user_id}",
            catch_response=True,
            name="GET /llm/analytics/recommendations"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")

    @task(2)
    def get_service_metrics(self):
        """
        GET /llm/analytics/metrics/{service_name} 엔드포인트 호출 (비율: 2)
        서비스 메트릭 조회
        """
        service_name = random.choice(self.service_names)

        with self.client.get(
            f"/llm/analytics/metrics/{service_name}",
            catch_response=True,
            name="GET /llm/analytics/metrics"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")


# 실행 예시:
# locust -f locust_normal_traffic.py --host=https://qna-api.jungle-panopticon.cloud
#
# 분당 300회 정도를 목표로 하려면:
# locust -f locust_normal_traffic.py --host=https://qna-api.jungle-panopticon.cloud --users 50 --spawn-rate 5
#
# 또는 웹 UI 없이 바로 실행:
# locust -f locust_normal_traffic.py --host=https://qna-api.jungle-panopticon.cloud --users 50 --spawn-rate 5 --headless --run-time 10m
