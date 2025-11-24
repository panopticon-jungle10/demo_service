"""
Locust 부하 테스트 - 에러 상황 연출
Bedrock 에러 시나리오를 시뮬레이션합니다.

특징:
- isError=true로 설정하여 의도적인 에러 발생
- 자연스러운 duration_ms 생성 (각 재시도마다 2초 후반대)
- trace_id와 span_id를 동적으로 생성
"""

import random
import uuid
import time
from locust import HttpUser, task, between


class ErrorScenarioUser(HttpUser):
    """에러 상황을 시뮬레이션하는 Locust 사용자"""

    # 에러 케이스는 좀 더 드물게 발생하도록 대기 시간 증가
    wait_time = between(3, 8)

    # 호스트는 명령줄에서 지정하거나 여기서 기본값 설정
    host = "https://qna-api.jungle-panopticon.cloud"

    def on_start(self):
        """사용자 세션 시작 시 실행"""
        self.user_id = f"error_user_{uuid.uuid4().hex[:8]}"
        self.conversation_id = str(uuid.uuid4())

        # 에러를 유발할 질문들
        self.error_questions = [
            "복잡한 알고리즘을 설명해주세요.",
            "딥러닝 모델 학습 방법은?",
            "분산 시스템의 CAP 이론을 자세히 설명해주세요.",
            "대규모 트래픽 처리 아키텍처를 알려주세요.",
            "블록체인 합의 알고리즘의 종류와 특징은?",
        ]

    @task(1)
    def chat_request_with_error(self):
        """
        POST /llm/chat 엔드포인트 호출 - 에러 시나리오
        isError=true로 설정하여 Bedrock 에러 발생
        """
        question = random.choice(self.error_questions)

        # 에러 상황에서도 가끔 글 작성 시도 (20% 확률)
        wants_to_post = random.random() < 0.2

        payload = {
            "conversationId": self.conversation_id,
            "originalQuestion": question,
            "wantsToPost": wants_to_post,
            "isError": True  # 에러 발생 플래그
        }

        # 글 작성하는 경우 postData 추가
        if wants_to_post:
            payload["postData"] = {
                "title": f"에러 질문: {question[:30]}...",
                "password": "test1234",
                "authorName": self.user_id,
                "isAnonymous": False,
                "isPrivate": False,
                "email": f"{self.user_id}@example.com"
            }

        # 요청 전 trace_id 생성 (로깅용)
        trace_id = uuid.uuid4().hex

        with self.client.post(
            "/llm/chat",
            json=payload,
            catch_response=True,
            name="POST /llm/chat (ERROR scenario)"
        ) as response:
            # 에러 상황이므로 502 상태 코드가 예상됨
            if response.status_code == 502:
                # 502는 예상된 에러이므로 성공으로 처리 (에러 시뮬레이션 목적)
                response.success()

                # 에러 관련 메트릭 로깅
                response_time = response.elapsed.total_seconds() * 1000

                # duration_ms가 적절한 범위인지 확인 (8~11초 예상)
                if 8000 <= response_time <= 11000:
                    print(f"[✓] Error scenario completed: {response_time:.2f}ms (trace_id: {trace_id})")
                else:
                    print(f"[!] Unexpected duration: {response_time:.2f}ms (trace_id: {trace_id})")
            elif response.status_code == 200:
                # 가끔 에러가 발생하지 않을 수도 있음 (정상 처리)
                response.success()
                print(f"[i] No error occurred this time (trace_id: {trace_id})")
            else:
                response.failure(f"Unexpected status {response.status_code} (trace_id: {trace_id})")


# 실행 예시:
# locust -f locust_error_scenario.py --host=https://qna-api.jungle-panopticon.cloud
#
# 에러 시나리오는 적은 수의 사용자로 실행하는 것이 좋습니다:
# locust -f locust_error_scenario.py --host=https://qna-api.jungle-panopticon.cloud --users 5 --spawn-rate 1
#
# 또는 웹 UI 없이 바로 실행 (10분간 실행):
# locust -f locust_error_scenario.py --host=https://qna-api.jungle-panopticon.cloud --users 5 --spawn-rate 1 --headless --run-time 10m
#
# 정상 트래픽과 에러 트래픽을 동시에 실행하려면:
# 터미널 1: locust -f locust_normal_traffic.py --host=https://qna-api.jungle-panopticon.cloud --users 50 --spawn-rate 5 --headless
# 터미널 2: locust -f locust_error_scenario.py --host=https://qna-api.jungle-panopticon.cloud --users 5 --spawn-rate 1 --headless
