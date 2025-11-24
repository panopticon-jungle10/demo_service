#!/bin/bash

##############################################################################
# 정상 + 에러 시나리오 로그/트레이스 동시 전송
##############################################################################

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  정상 + 에러 시나리오 동시 전송${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 환경 변수 확인
if [ -z "$PANOPTICON_LOG_URL" ] || [ -z "$PANOPTICON_TRACE_URL" ] || [ -z "$PANOPTICON_API_KEY" ]; then
    echo -e "${YELLOW}⚠ 환경 변수가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}다음 환경 변수를 설정해주세요:${NC}"
    echo "  - PANOPTICON_LOG_URL"
    echo "  - PANOPTICON_TRACE_URL"
    echo "  - PANOPTICON_API_KEY"
    echo ""
    echo -e "${YELLOW}예시:${NC}"
    echo "  export PANOPTICON_LOG_URL=https://your-panopticon-url/logs"
    echo "  export PANOPTICON_TRACE_URL=https://your-panopticon-url/traces"
    echo "  export PANOPTICON_API_KEY=your-api-key"
    echo ""
    exit 1
fi

# Python 확인
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠ Python3이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

# requests 라이브러리 확인
python3 -c "import requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ requests 라이브러리가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 명령어: pip3 install requests${NC}"
    exit 1
fi

echo -e "${GREEN}정상 트래픽 설정:${NC}"
echo -e "  간격: ${YELLOW}0.2초 (분당 약 300회)${NC}"
echo ""
echo -e "${RED}에러 시나리오 설정:${NC}"
echo -e "  간격: ${YELLOW}5초 (분당 약 12회)${NC}"
echo ""
echo -e "${BLUE}공통 설정:${NC}"
echo -e "  Log URL: ${YELLOW}${PANOPTICON_LOG_URL}${NC}"
echo -e "  Trace URL: ${YELLOW}${PANOPTICON_TRACE_URL}${NC}"
echo ""

# PID 파일 정의
NORMAL_PID_FILE="send_normal.pid"
ERROR_PID_FILE="send_error.pid"

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

echo -e "${GREEN}✓ 정상 트래픽 전송 시작 중...${NC}"
python3 send_normal_logs_traces.py > logs/send_normal_logs.log 2>&1 &

NORMAL_PID=$!
echo $NORMAL_PID > "$NORMAL_PID_FILE"
echo -e "  PID: ${YELLOW}${NORMAL_PID}${NC}"

sleep 2

echo -e "${RED}✓ 에러 시나리오 전송 시작 중...${NC}"
python3 send_error_logs_traces.py > logs/send_error_logs.log 2>&1 &

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
echo -e "  정상 트래픽: logs/send_normal_logs.log"
echo -e "  에러 시나리오: logs/send_error_logs.log"
echo ""
echo -e "${YELLOW}중지하려면: ./stop_all_sending.sh${NC}"
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
echo -e "${GREEN}  모든 전송 완료!${NC}"
echo -e "${GREEN}========================================${NC}"

# PID 파일 정리
rm -f "$NORMAL_PID_FILE" "$ERROR_PID_FILE"
