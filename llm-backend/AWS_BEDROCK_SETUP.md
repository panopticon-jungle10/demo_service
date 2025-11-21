# AWS Bedrock 설정 가이드

## 1. AWS Console 설정

### 1.1 Bedrock 모델 액세스 활성화

1. AWS Console 로그인
2. **Amazon Bedrock** 서비스로 이동
3. 왼쪽 메뉴에서 **Model access** 클릭
4. **Manage model access** 버튼 클릭
5. **Anthropic - Claude 3 Sonnet** 체크
6. **Request model access** 클릭
7. 승인 대기 (보통 즉시 승인됨)

**지원 리전:**
- `us-east-1` (버지니아 북부) - 권장
- `us-west-2` (오레곤)
- `ap-northeast-1` (도쿄)
- `ap-southeast-1` (싱가포르)

**참고:** `ap-northeast-2` (서울)은 현재 Bedrock을 지원하지 않습니다.

### 1.2 IAM 사용자 생성 및 권한 부여

#### 옵션 A: 전체 Bedrock 권한 (개발/테스트용)

1. AWS Console → **IAM** → **Users** → **Create user**
2. 사용자 이름 입력 (예: `bedrock-service-user`)
3. **Attach policies directly** 선택
4. **AmazonBedrockFullAccess** 정책 연결
5. **Create user** 클릭

#### 옵션 B: 최소 권한 (프로덕션 권장)

1. AWS Console → **IAM** → **Policies** → **Create policy**
2. JSON 탭에서 다음 입력:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-*"
    }
  ]
}
```

3. 정책 이름: `BedrockClaudeInvokeOnly`
4. **Create policy** 클릭
5. IAM Users에서 사용자 생성 후 이 정책 연결

### 1.3 Access Key 생성

1. IAM → Users → 생성한 사용자 클릭
2. **Security credentials** 탭
3. **Create access key** 클릭
4. **Application running outside AWS** 선택
5. **Create access key** 클릭
6. **Access key ID**와 **Secret access key** 복사 (⚠️ 이 페이지를 닫으면 Secret key는 다시 볼 수 없습니다!)

---

## 2. Python 프로젝트 설정

### 2.1 환경변수 설정

`.env` 파일 생성 (또는 `.env.example` 복사):

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Mock 모드 비활성화 (실제 AWS 사용)
USE_MOCK_AI=false

# API Backend URL
API_BACKEND_URL=http://localhost:3001

# Admin password (must match NestJS backend)
ADMIN_PASSWORD=your_admin_password

# AWS Bedrock settings
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**중요:**
- `AWS_REGION`은 Bedrock을 지원하는 리전으로 설정 (예: `us-east-1`)
- `AWS_ACCESS_KEY_ID`는 `AKIA`로 시작
- `AWS_SECRET_ACCESS_KEY`는 40자 길이의 문자열

### 2.2 Credentials 설정 방법 (3가지)

#### 방법 1: 환경변수 (권장 - 프로덕션)

위의 `.env` 파일에 설정 → **boto3가 자동으로 읽음**

#### 방법 2: AWS CLI Credentials 파일

```bash
# AWS CLI 설치
pip install awscli

# Configure 실행
aws configure

# 입력 항목:
# AWS Access Key ID: AKIAXXXXXXXXXXXXXXXX
# AWS Secret Access Key: your_secret_access_key
# Default region name: us-east-1
# Default output format: json
```

생성된 파일 위치:
- macOS/Linux: `~/.aws/credentials`
- Windows: `C:\Users\USERNAME\.aws\credentials`

#### 방법 3: IAM Role (EC2/ECS에서 실행 시)

EC2 인스턴스나 ECS Task에 IAM Role을 연결하면 credentials 파일 없이도 작동합니다.

---

## 3. 테스트

### 3.1 Mock 모드 → 실제 Bedrock으로 전환

`.env` 수정:
```env
USE_MOCK_AI=false
```

### 3.2 서버 재시작

```bash
cd llm-backend
python -m uvicorn app.main:app --reload --port 8001
```

### 3.3 로그 확인

정상 작동 시:
```
INFO - Bedrock client initialized with credentials from environment variables (region: us-east-1)
```

에러 발생 시:
```
ERROR - Bedrock ClientError: ...
```

### 3.4 테스트 요청

```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-123",
    "originalQuestion": "로그 수집이 뭔가요?",
    "wantsToPost": false
  }'
```

---

## 4. 문제 해결

### 4.1 "Could not connect to the endpoint URL"

- **원인:** 리전이 Bedrock을 지원하지 않음
- **해결:** `AWS_REGION`을 `us-east-1` 또는 `us-west-2`로 변경

### 4.2 "AccessDeniedException"

- **원인:** IAM 권한 부족
- **해결:**
  - IAM User에 `AmazonBedrockFullAccess` 정책 연결 확인
  - Bedrock Model access가 승인되었는지 확인

### 4.3 "The security token included in the request is invalid"

- **원인:** Access Key가 잘못되었거나 만료됨
- **해결:**
  - Access Key 재생성
  - `.env` 파일의 `AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY` 확인

### 4.4 "ValidationException: The provided model identifier is invalid"

- **원인:** 모델 ID 오류 또는 해당 리전에서 지원하지 않는 모델
- **해결:**
  - `bedrock_service.py`의 `model_id` 확인
  - 현재 설정: `anthropic.claude-3-sonnet-20240229-v1:0`

### 4.5 요금 확인

- AWS Console → Billing → Cost Explorer
- Bedrock 요금: 입력 토큰당 $0.003, 출력 토큰당 $0.015 (Claude 3 Sonnet 기준)
- 예상 비용: 1000개 질문/답변 ≈ $10-20

---

## 5. 프로덕션 배포 시 권장사항

1. **환경변수 관리**
   - `.env` 파일을 `.gitignore`에 추가 (이미 되어있음)
   - 프로덕션에서는 환경변수를 직접 설정 (Docker, Kubernetes Secrets 등)

2. **IAM 권한 최소화**
   - 프로덕션에서는 옵션 B (최소 권한) 사용

3. **리전 선택**
   - 사용자와 가까운 리전 선택 (지연시간 감소)
   - 비용 비교 (리전마다 요금이 다를 수 있음)

4. **모니터링**
   - CloudWatch Logs 활성화
   - 비용 알림 설정

5. **Rate Limiting**
   - Bedrock API 호출 제한 설정
   - 사용자당 요청 제한 구현
