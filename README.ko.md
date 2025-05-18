# API Caller MCP Server

MCP(Model Context Protocol) 서버: 외부 RESTful API를 호출할 수 있는 서비스를 제공합니다.

## 기능

이 MCP 서버는 Claude와 같은 LLM이 외부 RESTful API를 호출할 수 있도록 도구를 제공합니다. 다음과 같은 기능이 있습니다:

- 다양한 HTTP 메서드 지원 (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- 헤더, 쿼리 파라미터, 요청 바디 데이터 등의 설정 가능
- 타임아웃 설정 가능
- 오류 처리 및 응답 포맷팅

## 설치 및 실행

### 요구 사항

- Node.js 16.x 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install
```

### 빌드

```bash
# TypeScript 컴파일
npm run build
```

### 실행

```bash
# StdIO 버전 실행 (Claude Desktop과 같은 MCP 클라이언트와 통합)
npm start

# HTTP 서버 버전 실행 (API로 노출)
npm run start:http

# 개발 모드로 실행 (TypeScript를 직접 실행)
npm run dev

# HTTP 서버 개발 모드 실행
npm run dev:http

# 파일 변경 감지 모드 (개발 시 유용)
npm run watch

# 테스트 클라이언트 실행
npm run test
```

## Claude Desktop에 MCP 서버 추가하기

### 1. claude_desktop_config.json 파일 설정

`claude_desktop_config.json` 파일을 다음과 같이 설정합니다. `npx`를 사용하여 의존성 설치와 함께 실행합니다:

```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "외부 RESTful API를 호출할 수 있는 MCP 서비스",
  "command": "npx",
  "args": ["--yes", "--package=dotenv", "--package=axios", "--package=@modelcontextprotocol/sdk", "node", "{your_mcp_path}/api_caller/index.js"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**대체 설정 옵션:**

1. **배치 파일 사용 (권장):**
```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "외부 RESTful API를 호출할 수 있는 MCP 서비스",
  "command": "{your_mcp_path}/api_caller/run_with_npx.bat",
  "args": [],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **npm 스크립트 사용:**
```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "외부 RESTful API를 호출할 수 있는 MCP 서비스",
  "command": "npx",
  "args": ["--yes", "npm", "run", "start"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

> **중요**: 파일 경로가 실제 프로젝트 폴더의 절대 경로와 일치하는지 확인하세요.

### 2. Claude Desktop에 MCP 제공자 추가

1. **Claude Desktop 실행**: Claude Desktop 애플리케이션을 실행합니다.

2. **설정 메뉴 열기**: 
   - Claude Desktop 창의 왼쪽 하단에 있는 프로필 아이콘이나 설정 아이콘을 클릭합니다.
   - 메뉴에서 "설정(Settings)" 옵션을 선택합니다.

3. **MCP 제공자 탭으로 이동**:
   - 설정 메뉴에서 "MCP 제공자(MCP Providers)" 또는 "Tools(도구)" 탭을 찾아 클릭합니다.

4. **새 MCP 제공자 추가**:
   - "새 MCP 제공자 추가(Add New MCP Provider)" 또는 "+" 버튼을 클릭합니다.

5. **구성 파일 선택**:
   - 파일 선택 대화상자에서 `claude_desktop_config.json` 파일로 이동합니다.
   - 경로: `{your_mcp_path}/api_caller/claude_desktop_config.json`
   - 이 파일을 선택하고 "열기(Open)"를 클릭합니다.

6. **MCP 공급자 활성화**:
   - API Caller가 목록에 추가되면 옆에 있는 토글 스위치를 켜서 활성화합니다.

### 3. 문제 해결

연결에 문제가 있을 경우:

1. **의존성 설치 확인**:
   ```bash
   npm install
   ```

2. **경로 설정 확인**:
   - 모든 파일 경로가 올바르게 설정되어 있는지 확인합니다.
   - 배치 파일 방식 사용 시 `run_with_npx.bat` 파일이 존재하는지 확인합니다.

3. **권한 문제**:
   - 관리자 권한으로 명령 프롬프트를 열고 실행합니다.

4. **로그 확인**:
   - Claude Desktop 로그를 확인하여 오류 메시지를 확인합니다.
   - 배치 파일을 직접 실행하여 오류 메시지를 확인합니다.

5. **npx 설치 확인**:
   ```bash
   npm install -g npx
   ```

6. **모듈 형식 문제**:
   - 모듈 형식(CommonJS vs ES 모듈) 문제가 발생하면 `package.json`에서 `"type": "module"` 설정을 확인하세요.

## 사용 방법

먼저 저장소를 클론합니다:

```bash
git clone https://github.com/g2developer/api_caller_mcp_server.git
cd api_caller_mcp_server
```

이 MCP 서버는 Model Context Protocol을 지원하는 LLM 클라이언트와 함께 사용할 수 있습니다.

### StdIO 인터페이스

Claude Desktop과 같은 클라이언트에서 이 서버를 MCP 제공자로 등록하여 사용할 수 있습니다.

### HTTP 인터페이스

HTTP 서버 버전은 다음 엔드포인트를 제공합니다:

- `POST /mcp`: MCP 클라이언트에서 서버로의 요청을 처리합니다.
- `GET /mcp`: 서버에서 클라이언트로의 알림을 SSE(Server-Sent Events)로 전송합니다.
- `DELETE /mcp`: 세션을 종료합니다.
- `GET /health`: 서버 상태를 확인합니다.

세션 관리를 위해 `mcp-session-id` 헤더를 사용합니다.

### call_api 도구

외부 RESTful API를 호출합니다.

#### 파라미터:

- `url` (필수): 호출할 API의 URL
- `method` (선택, 기본값: GET): HTTP 메서드 (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- `headers` (선택): 요청 헤더 (API 키, 인증 토큰 등)
- `params` (선택): URL 쿼리 파라미터
- `data` (선택): 요청 바디 데이터 (POST, PUT, PATCH에서 사용)
- `timeout` (선택, 기본값: 30000): 요청 타임아웃 (ms 단위)

#### 반환값:

성공 시:
```json
{
  "status": "success",
  "statusCode": 200,
  "headers": { ... },
  "data": { ... }
}
```

실패 시:
```json
{
  "status": "error",
  "message": "오류 메시지",
  "statusCode": 404,
  "headers": { ... },
  "data": { ... }
}
```

## 예제

### 기본 GET 요청
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts/1"
}
```

### 쿼리 파라미터가 있는 GET 요청
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "params": {
    "userId": 1
  }
}
```

### 데이터가 있는 POST 요청
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "data": {
    "title": "foo",
    "body": "bar",
    "userId": 1
  }
}
```

### 인증 헤더가 있는 요청
```json
{
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer your_token_here"
  }
}
```

## 환경 변수

`.env` 파일에서 다음 환경 변수를 설정할 수 있습니다:

- `PORT`: HTTP 서버 사용 시 포트 번호 (기본값: 3071)
- `NODE_ENV`: 실행 환경 (development, production, test)
- `DEFAULT_TIMEOUT`: API 호출 기본 타임아웃 (밀리초)
- `LOG_LEVEL`: 로깅 레벨 (debug, info, warn, error)
- `DEFAULT_API_KEY`: 기본 API 키 (필요한 경우)
- `DEFAULT_AUTH_TOKEN`: 기본 인증 토큰 (필요한 경우)
- `ALLOW_ORIGIN`: CORS 설정 (기본값: *)

## 라이선스

MIT 라이선스 