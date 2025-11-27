/**
 * 트레이스 ID 생성 (32자 hex)
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * 스팬 ID 생성 (16자 hex)
 */
export function generateSpanId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * 현재 시간을 ISO 8601 형식으로 반환 (UTC)
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 단일 트레이스 생성
 * @param isError - true면 ERROR 상태, false면 OK 상태
 */
export function generateSingleTrace(isError: boolean = false) {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const timestamp = getCurrentTimestamp();

  const status = isError ? 'ERROR' : 'OK';
  const httpStatusCode = isError ? 500 : 200;

  return {
    type: 'span',
    timestamp,
    service_name: 'LogQ-API-Backend',
    environment: 'Production',
    trace_id: traceId,
    span_id: spanId,
    parent_span_id: null, // 루트 스팬
    name: isError ? 'ERROR /api/error' : 'GET /api/normal',
    kind: 'SERVER',
    duration_ms: Math.random() * 100, // 0-100ms
    status,
    http_method: 'GET',
    http_path: isError ? '/api/error' : '/api/normal',
    http_status_code: httpStatusCode,
  };
}

/**
 * N개의 독립적인 트레이스 생성
 * @param count - 생성할 트레이스 개수
 * @param isError - 에러 트레이스 여부
 */
export function generateBatchTraces(count: number, isError: boolean = false) {
  return Array.from({ length: count }, () => generateSingleTrace(isError));
}
