#!/bin/bash

##############################################################################
# Locust Web UI 모드 실행 스크립트
##############################################################################

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Locust Web UI 모드${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 기본 설정
HOST="https://qna-api.jungle-panopticon.cloud"
PORT=8089
SCENARIO="normal"

# 명령줄 인자 처리
while getopts "s:p:h" opt; do
  case $opt in
    s) SCENARIO=$OPTARG ;;
    p) PORT=$OPTARG ;;
    h)
      echo "사용법: $0 [-s scenario] [-p port]"
      echo "  -s: 시나리오 선택 (normal|error|both, 기본값: normal)"
      echo "  -p: 웹 UI 포트 (기본값: 8089)"
      echo ""
      echo "예시:"
      echo "  $0 -s normal      # 정상 트래픽만"
      echo "  $0 -s error       # 에러 시나리오만"
      echo "  $0 -s both -p 8090  # 두 시나리오 동시 (다른 포트)"
      exit 0
      ;;
    \?)
      echo "잘못된 옵션: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# locust 설치 확인
if ! command -v locust &> /dev/null; then
    echo -e "${YELLOW}⚠ Locust가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 명령어: pip install locust${NC}"
    exit 1
fi

case $SCENARIO in
    normal)
        echo -e "${GREEN}시나리오: 정상 트래픽${NC}"
        echo -e "  파일: locust_normal_traffic.py"
        LOCUSTFILE="locust_normal_traffic.py"
        ;;
    error)
        echo -e "${YELLOW}시나리오: 에러 시나리오${NC}"
        echo -e "  파일: locust_error_scenario.py"
        LOCUSTFILE="locust_error_scenario.py"
        ;;
    both)
        echo -e "${MAGENTA}시나리오: 정상 + 에러 (동시 실행)${NC}"
        echo -e "${YELLOW}⚠ Web UI 모드에서는 한 번에 하나의 시나리오만 실행됩니다.${NC}"
        echo -e "${YELLOW}  두 시나리오를 동시에 실행하려면 ./run_both_scenarios.sh를 사용하세요.${NC}"
        echo ""
        echo -e "정상 트래픽으로 시작합니다..."
        LOCUSTFILE="locust_normal_traffic.py"
        ;;
    *)
        echo -e "${YELLOW}⚠ 알 수 없는 시나리오: $SCENARIO${NC}"
        echo -e "사용 가능한 시나리오: normal, error, both"
        exit 1
        ;;
esac

echo -e "  호스트: ${YELLOW}${HOST}${NC}"
echo -e "  웹 UI 포트: ${YELLOW}${PORT}${NC}"
echo ""

# 포트 사용 확인
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 포트 ${PORT}가 이미 사용 중입니다.${NC}"
    EXISTING_PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    echo -e "${YELLOW}  기존 프로세스 PID: ${EXISTING_PID}${NC}"
    echo ""
    read -p "기존 프로세스를 종료하고 계속하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $EXISTING_PID 2>/dev/null
        sleep 2
        echo -e "${GREEN}✓ 기존 프로세스 종료됨${NC}"
    else
        echo "종료합니다."
        exit 0
    fi
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Locust Web UI 시작 중...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${MAGENTA}웹 브라우저에서 다음 주소로 접속하세요:${NC}"
echo -e "${YELLOW}  http://localhost:${PORT}${NC}"
echo ""
echo -e "${BLUE}권장 설정:${NC}"
if [ "$SCENARIO" = "error" ]; then
    echo -e "  Number of users: ${YELLOW}5${NC}"
    echo -e "  Spawn rate: ${YELLOW}1${NC}"
else
    echo -e "  Number of users: ${YELLOW}50${NC}"
    echo -e "  Spawn rate: ${YELLOW}5${NC}"
fi
echo ""
echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요${NC}"
echo ""

# Locust Web UI 모드로 실행
locust -f "$LOCUSTFILE" \
    --host="${HOST}" \
    --web-port="${PORT}"
