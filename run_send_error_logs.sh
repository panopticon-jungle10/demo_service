#!/bin/bash

##############################################################################
# 에러 시나리오 로그/트레이스 전송 스크립트 실행
##############################################################################

# 색상 정의
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  에러 시나리오 로그/트레이스 전송${NC}"
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
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
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

echo -e "${RED}✓ Python3 실행 중... (에러 시나리오)${NC}"
echo -e "${YELLOW}  종료하려면 Ctrl+C를 누르세요${NC}"
echo ""

# Python 스크립트 실행
python3 send_error_logs_traces.py

echo ""
echo -e "${RED}========================================${NC}"
echo -e "${RED}  전송 완료!${NC}"
echo -e "${RED}========================================${NC}"
