#!/bin/bash

##############################################################################
# 모든 로그/트레이스 전송 프로세스 중지 스크립트
##############################################################################

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  로그/트레이스 전송 프로세스 중지${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# PID 파일 정의
NORMAL_PID_FILE="send_normal.pid"
ERROR_PID_FILE="send_error.pid"

STOPPED=0

# 정상 트래픽 프로세스 중지
if [ -f "$NORMAL_PID_FILE" ]; then
    NORMAL_PID=$(cat "$NORMAL_PID_FILE")
    if ps -p "$NORMAL_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 정상 트래픽 전송 프로세스 종료 중... (PID: $NORMAL_PID)${NC}"
        kill "$NORMAL_PID" 2>/dev/null
        sleep 2

        # 강제 종료 확인
        if ps -p "$NORMAL_PID" > /dev/null 2>&1; then
            echo -e "${RED}  강제 종료 중...${NC}"
            kill -9 "$NORMAL_PID" 2>/dev/null
        fi

        echo -e "${GREEN}✓ 정상 트래픽 전송 프로세스 종료됨${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${YELLOW}  정상 트래픽 전송 프로세스가 이미 종료되었습니다.${NC}"
    fi
    rm -f "$NORMAL_PID_FILE"
fi

# 에러 시나리오 프로세스 중지
if [ -f "$ERROR_PID_FILE" ]; then
    ERROR_PID=$(cat "$ERROR_PID_FILE")
    if ps -p "$ERROR_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 에러 시나리오 전송 프로세스 종료 중... (PID: $ERROR_PID)${NC}"
        kill "$ERROR_PID" 2>/dev/null
        sleep 2

        # 강제 종료 확인
        if ps -p "$ERROR_PID" > /dev/null 2>&1; then
            echo -e "${RED}  강제 종료 중...${NC}"
            kill -9 "$ERROR_PID" 2>/dev/null
        fi

        echo -e "${GREEN}✓ 에러 시나리오 전송 프로세스 종료됨${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${YELLOW}  에러 시나리오 전송 프로세스가 이미 종료되었습니다.${NC}"
    fi
    rm -f "$ERROR_PID_FILE"
fi

# PID 파일 없이 실행 중인 send 프로세스 찾기
echo ""
echo -e "${YELLOW}기타 전송 프로세스 확인 중...${NC}"
SEND_PIDS=$(pgrep -f "python3 send_.*_logs_traces.py" | grep -v $$)

if [ -n "$SEND_PIDS" ]; then
    echo -e "${YELLOW}발견된 전송 프로세스:${NC}"
    echo "$SEND_PIDS" | while read pid; do
        CMDLINE=$(ps -p $pid -o args= 2>/dev/null)
        echo -e "  PID ${YELLOW}$pid${NC}: $CMDLINE"
    done

    echo ""
    read -p "이 프로세스들을 종료하시겠습니까? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$SEND_PIDS" | while read pid; do
            echo -e "${YELLOW}⚠ PID $pid 종료 중...${NC}"
            kill $pid 2>/dev/null
        done

        sleep 2

        # 강제 종료 확인
        REMAINING=$(pgrep -f "python3 send_.*_logs_traces.py" | grep -v $$)
        if [ -n "$REMAINING" ]; then
            echo -e "${RED}  일부 프로세스 강제 종료 중...${NC}"
            echo "$REMAINING" | while read pid; do
                kill -9 $pid 2>/dev/null
            done
        fi

        echo -e "${GREEN}✓ 모든 전송 프로세스 종료됨${NC}"
        STOPPED=$((STOPPED + $(echo "$SEND_PIDS" | wc -l)))
    fi
else
    echo -e "${GREEN}  실행 중인 전송 프로세스가 없습니다.${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
if [ $STOPPED -gt 0 ]; then
    echo -e "${GREEN}  총 ${STOPPED}개 프로세스 종료됨${NC}"
else
    echo -e "${YELLOW}  종료된 프로세스 없음${NC}"
fi
echo -e "${BLUE}========================================${NC}"
