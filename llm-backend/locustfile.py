"""
Locust 부하 테스트 파일
- 분당 100개 요청
- 4개 엔드포인트 균등 분배
"""

from locust import HttpUser, task, between
import random


class LLMBackendUser(HttpUser):
    wait_time = between(0.5, 1.5)  # 0.5~1.5초 간격으로 요청
    host = "https://qna-api.jungle-panopticon.cloud"

    @task(25)
    def analytics_track(self):
        """사용자 행동 추적"""
        user_ids = [f"user{i}" for i in range(1, 101)]
        actions = ["view_post", "create_comment", "like_post", "share_post"]

        # Query 파라미터로 전송
        self.client.post(
            "/llm/analytics/track",
            params={
                "user_id": random.choice(user_ids),
                "action": random.choice(actions),
            },
            name="/llm/analytics/track",
        )

    @task(25)
    def analytics_recommendations(self):
        """추천 조회"""
        user_id = f"user{random.randint(1, 100)}"

        self.client.get(
            f"/llm/analytics/recommendations/{user_id}",
            name="/llm/analytics/recommendations/[user_id]",
        )

    @task(25)
    def analytics_metrics(self):
        """메트릭 조회"""
        services = ["llm-service", "api-service", "frontend-service"]

        self.client.get(
            f"/llm/analytics/metrics/{random.choice(services)}",
            name="/llm/analytics/metrics/[service_name]",
        )

    @task(25)
    def chat_ask(self):
        """AI 채팅 (정상 케이스)"""
        questions = [
            "로그 수집이란 무엇인가요?",
            "분산 추적에 대해 설명해주세요",
            "모니터링 시스템의 중요성은?",
            "OpenTelemetry가 무엇인가요?",
            "로그와 트레이스의 차이는?",
        ]

        self.client.post(
            "/llm/chat/ask",
            json={
                "conversationId": f"conv-{random.randint(1, 10000)}",
                "originalQuestion": random.choice(questions),
                "isError": False,  # 정상 케이스만
            },
            name="/llm/chat/ask",
        )


"""
locust -f locustfile.py --host=https://qna-api.jungle-panopticon.cloud -u 10 -r 2 --headless


#높은 부하 (200개/분)
# 20명 사용자, 초당 3명씩 증가

locust -f locustfile.py --host=https://qna-api.jungle-panopticon.cloud -u 20 -r 3 --headless
"""
