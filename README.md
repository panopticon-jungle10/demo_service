# 로그 수집 서비스 Q&A 데모

로그 수집 서비스에 대한 Q&A 데모 사이트입니다. 일회용이며, 추후 로그 수집기를 적용할 예정입니다.

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS

### API Backend
- NestJS
- TypeORM
- PostgreSQL

### LLM Backend
- FastAPI
- AWS Bedrock (boto3)
- Claude 3 Sonnet

## 프로젝트 구조

```
demo_service/
├── frontend/          # Next.js 프론트엔드
├── api-backend/       # NestJS API 서버
├── llm-backend/       # FastAPI LLM 서버
├── docker-compose.yml # 로컬 개발 환경
└── README.md
```

## 시작하기

### 사전 요구사항
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- AWS 계정 (Bedrock 접근 권한)

### 환경 변수 설정

각 서비스 디렉토리에 `.env` 파일을 생성하세요:

#### api-backend/.env
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=demo_service
LLM_BACKEND_URL=http://localhost:8001
```

#### llm-backend/.env
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 로컬 실행

1. PostgreSQL 시작:
```bash
docker-compose up -d postgres
```

2. API Backend 실행:
```bash
cd api-backend
npm install
npm run start:dev
```

3. LLM Backend 실행:
```bash
cd llm-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

4. Frontend 실행:
```bash
cd frontend
npm install
npm run dev
```

### Docker로 전체 실행

```bash
docker-compose up -d
```

## API 엔드포인트

- Frontend: http://localhost:3000
- API Backend: http://localhost:3001
- LLM Backend: http://localhost:8001

## 개발 가이드

### API Backend (NestJS)
- `api-backend/src/`: 소스 코드
- `api-backend/src/modules/`: 기능별 모듈

### LLM Backend (FastAPI)
- `llm-backend/app/`: 소스 코드
- `llm-backend/app/routers/`: API 라우터

### Frontend (Next.js)
- `frontend/src/app/`: App Router 페이지
- `frontend/src/components/`: 재사용 컴포넌트

## 라이선스

MIT
