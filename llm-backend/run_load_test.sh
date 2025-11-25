#!/bin/bash

echo "🚀 부하 테스트 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 정상 트래픽: 분당 100개 (Locust)"
echo "❌ 에러 트래픽: 분당 8개 (Producer 직접)"
echo ""
echo "⛔ Ctrl+C로 종료하세요"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 정리 함수
cleanup() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🛑 종료 중..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 모든 자식 프로세스 종료
    kill 0
    exit 0
}

# Ctrl+C 시그널 잡기
trap cleanup SIGINT SIGTERM

# 1. Locust 백그라운드 실행 (정상 트래픽)
echo "▶️  Locust 시작 중... (정상 트래픽)"
locust -f locustfile.py \
    --host=https://qna-api.jungle-panopticon.cloud \
    -u 10 \
    -r 2 \
    --headless \
    --logfile locust.log &

LOCUST_PID=$!
echo "   Locust PID: $LOCUST_PID"
echo ""

# 2. 5초 대기 (Locust 안정화)
echo "⏳ Locust 안정화 대기 (5초)..."
sleep 5
echo ""

# 3. Producer 에러 전송 스크립트 실행
echo "▶️  에러 시나리오 전송 시작..."
python3 send_error_scenarios.py &

ERROR_PID=$!
echo "   에러 전송 PID: $ERROR_PID"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 모든 프로세스 실행 중"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📈 실시간 통계는 locust.log 파일을 확인하세요"
echo "   tail -f locust.log"
echo ""

# 백그라운드 프로세스 대기
wait
