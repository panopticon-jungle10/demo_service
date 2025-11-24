#!/bin/bash

##############################################################################
# 정상 트래픽 + 에러 시나리오 동시 실행 스크립트
##############################################################################

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  정상 + 에러 시나리오 동시 실행${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 기본 설정
HOST="https://qna-api.jungle-panopticon.cloud"
NORMAL_USERS=50
NORMAL_SPAWN_RATE=5
ERROR_USERS=5
ERROR_SPAWN_RATE=1
RUN_TIME="10m"

# 명령줄 인자 처리
while getopts "n:e:t:h" opt; do
  case $opt in
    n) NORMAL_USERS=$OPTARG ;;
    e) ERROR_USERS=$OPTARG ;;
    t) RUN_TIME=$OPTARG ;;
    h)
      echo "사용법: $0 [-n normal_users] [-e error_users] [-t run_time]"
      echo "  -n: 정상 트래픽 사용자 수 (기본값: 50)"
      echo "  -e: 에러 시나리오 사용자 수 (기본값: 5)"
      echo "  -t: 실행 시간 (기본값: 10m)"
      echo ""
      echo "예시: $0 -n 100 -e 10 -t 30m"
      exit 0
      ;;
    \?)
      echo "잘못된 옵션: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

echo -e "${GREEN}정상 트래픽 설정:${NC}"
echo -e "  사용자 수: ${YELLOW}${NORMAL_USERS}${NC}"
echo -e "  증가 속도: ${YELLOW}${NORMAL_SPAWN_RATE}/초${NC}"
echo ""
echo -e "${RED}에러 시나리오 설정:${NC}"
echo -e "  사용자 수: ${YELLOW}${ERROR_USERS}${NC}"
echo -e "  증가 속도: ${YELLOW}${ERROR_SPAWN_RATE}/초${NC}"
echo ""
echo -e "${BLUE}공통 설정:${NC}"
echo -e "  호스트: ${YELLOW}${HOST}${NC}"
echo -e "  실행 시간: ${YELLOW}${RUN_TIME}${NC}"
echo ""

# locust 설치 확인
if ! command -v locust &> /dev/null; then
    echo -e "${YELLOW}⚠ Locust가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 명령어: pip install locust${NC}"
    exit 1
fi

# PID 파일 정의
NORMAL_PID_FILE="locust_normal.pid"
ERROR_PID_FILE="locust_error.pid"

# 기존 프로세스 정리
if [ -f "$NORMAL_PID_FILE" ]; then
    OLD_PID=$(cat "$NORMAL_PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 기존 정상 트래픽 프로세스 종료 중... (PID: $OLD_PID)${NC}"
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm -f "$NORMAL_PID_FILE"
fi

if [ -f "$ERROR_PID_FILE" ]; then
    OLD_PID=$(cat "$ERROR_PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 기존 에러 시나리오 프로세스 종료 중... (PID: $OLD_PID)${NC}"
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm -f "$ERROR_PID_FILE"
fi

# 로그 디렉토리 생성
mkdir -p logs

echo -e "${GREEN}✓ 정상 트래픽 시작 중...${NC}"
locust -f locust_normal_traffic.py \
    --host="${HOST}" \
    --users "${NORMAL_USERS}" \
    --spawn-rate "${NORMAL_SPAWN_RATE}" \
    --run-time "${RUN_TIME}" \
    --headless \
    --html=logs/locust_normal_traffic_report.html \
    > logs/normal_traffic.log 2>&1 &

NORMAL_PID=$!
echo $NORMAL_PID > "$NORMAL_PID_FILE"
echo -e "  PID: ${YELLOW}${NORMAL_PID}${NC}"

sleep 2

echo -e "${RED}✓ 에러 시나리오 시작 중...${NC}"
locust -f locust_error_scenario.py \
    --host="${HOST}" \
    --users "${ERROR_USERS}" \
    --spawn-rate "${ERROR_SPAWN_RATE}" \
    --run-time "${RUN_TIME}" \
    --headless \
    --html=logs/locust_error_scenario_report.html \
    > logs/error_scenario.log 2>&1 &

ERROR_PID=$!
echo $ERROR_PID > "$ERROR_PID_FILE"
echo -e "  PID: ${YELLOW}${ERROR_PID}${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  두 시나리오 모두 실행 중...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}정상 트래픽 PID: ${YELLOW}${NORMAL_PID}${NC}"
echo -e "${RED}에러 시나리오 PID: ${YELLOW}${ERROR_PID}${NC}"
echo ""
echo -e "${YELLOW}로그 위치:${NC}"
echo -e "  정상 트래픽: logs/normal_traffic.log"
echo -e "  에러 시나리오: logs/error_scenario.log"
echo ""
echo -e "${YELLOW}보고서 (테스트 완료 후):${NC}"
echo -e "  정상 트래픽: logs/locust_normal_traffic_report.html"
echo -e "  에러 시나리오: logs/locust_error_scenario_report.html"
echo ""
echo -e "${YELLOW}중지하려면: ./stop_all_locust.sh${NC}"
echo ""

# 종료 대기 (선택사항)
echo -e "${BLUE}프로세스 모니터링 중... (Ctrl+C로 백그라운드로 전환)${NC}"
echo ""

# 프로세스 상태 모니터링
trap 'echo -e "\n${YELLOW}백그라운드로 전환됩니다...${NC}"; exit 0' INT

while ps -p $NORMAL_PID > /dev/null 2>&1 || ps -p $ERROR_PID > /dev/null 2>&1; do
    sleep 5

    if ps -p $NORMAL_PID > /dev/null 2>&1; then
        NORMAL_STATUS="${GREEN}실행 중${NC}"
    else
        NORMAL_STATUS="${YELLOW}종료됨${NC}"
    fi

    if ps -p $ERROR_PID > /dev/null 2>&1; then
        ERROR_STATUS="${GREEN}실행 중${NC}"
    else
        ERROR_STATUS="${YELLOW}종료됨${NC}"
    fi

    echo -e "[$(date +%H:%M:%S)] 정상: ${NORMAL_STATUS} | 에러: ${ERROR_STATUS}"
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  모든 테스트 완료!${NC}"
echo -e "${GREEN}========================================${NC}"

# PID 파일 정리
rm -f "$NORMAL_PID_FILE" "$ERROR_PID_FILE"
