#!/bin/bash

##############################################################################
# 에러 시나리오 부하 테스트 실행 스크립트
##############################################################################

# 색상 정의
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  에러 시나리오 부하 테스트 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 기본 설정
HOST="https://qna-api.jungle-panopticon.cloud"
USERS=5
SPAWN_RATE=1
RUN_TIME="10m"

# 명령줄 인자로 설정 변경 가능
while getopts "u:s:t:h" opt; do
  case $opt in
    u) USERS=$OPTARG ;;
    s) SPAWN_RATE=$OPTARG ;;
    t) RUN_TIME=$OPTARG ;;
    h)
      echo "사용법: $0 [-u users] [-s spawn_rate] [-t run_time]"
      echo "  -u: 동시 사용자 수 (기본값: 5)"
      echo "  -s: 사용자 증가 속도 (기본값: 1)"
      echo "  -t: 실행 시간 (기본값: 10m)"
      echo ""
      echo "예시: $0 -u 10 -s 2 -t 30m"
      exit 0
      ;;
    \?)
      echo "잘못된 옵션: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

echo -e "${RED}설정:${NC}"
echo -e "  호스트: ${YELLOW}${HOST}${NC}"
echo -e "  사용자 수: ${YELLOW}${USERS}${NC}"
echo -e "  증가 속도: ${YELLOW}${SPAWN_RATE}/초${NC}"
echo -e "  실행 시간: ${YELLOW}${RUN_TIME}${NC}"
echo ""

# locust 설치 확인
if ! command -v locust &> /dev/null; then
    echo -e "${YELLOW}⚠ Locust가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 명령어: pip install locust${NC}"
    exit 1
fi

echo -e "${RED}✓ Locust 실행 중... (에러 시나리오)${NC}"
echo -e "${YELLOW}  종료하려면 Ctrl+C를 누르세요${NC}"
echo ""

# Locust 실행 (headless 모드)
locust -f locust_error_scenario.py \
    --host="${HOST}" \
    --users "${USERS}" \
    --spawn-rate "${SPAWN_RATE}" \
    --run-time "${RUN_TIME}" \
    --headless \
    --html=locust_error_scenario_report.html

echo ""
echo -e "${RED}========================================${NC}"
echo -e "${RED}  테스트 완료!${NC}"
echo -e "${RED}========================================${NC}"
echo -e "보고서: ${YELLOW}locust_error_scenario_report.html${NC}"
