#!/usr/bin/env node

// 표준 에러에 로그 기록 (Claude 데스크톱 로그에 나타납니다)
console.error('MCP Server debug: Starting API Caller server');

// 필요한 모듈 로드
const axios = require('axios');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
require('dotenv').config();

console.log('API Caller MCP Server is starting...');

// MCP Server 초기화
const server = new McpServer({
  name: "API Caller",
  version: "1.0.0",
});

// call_api 도구 정의
server.tool(
  "call_api",
  {
    url: { type: "string", description: "호출할 API의 URL" },
    method: { 
      type: "string", 
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      description: "HTTP 메서드 (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)",
      default: "GET"
    },
    headers: { 
      type: "object", 
      description: "요청 헤더 (API 키, 인증 토큰 등)"
    },
    params: { 
      type: "object", 
      description: "URL 쿼리 파라미터"
    },
    data: { 
      type: "object", 
      description: "요청 바디 데이터 (POST, PUT, PATCH에서 사용)"
    },
    timeout: { 
      type: "number", 
      description: "요청 타임아웃 (ms 단위)"
    }
  },
  async ({ url, method = "GET", headers = {}, params = {}, data = {}, timeout = 30000 }) => {
    try {
      console.error(`API Caller MCP Server: Making ${method} request to ${url}`);
      
      // API 호출 설정
      const config = {
        url,
        method: method.toUpperCase(),
        headers,
        params,
        timeout,
      };
      
      // 데이터 추가 (GET, HEAD, OPTIONS 메서드에서는 데이터를 보내지 않음)
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && Object.keys(data).length > 0) {
        config.data = data;
      }
      
      // API 호출 실행
      const response = await axios(config);
      
      // 응답 준비
      const result = {
        status: 'success',
        statusCode: response.status,
        headers: response.headers,
        data: response.data
      };
      
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: false
      };
    } catch (error) {
      console.error(`API Caller MCP Server: Error in API call: ${error.message}`);
      
      // 오류 응답 준비
      let errorResponse = {
        status: 'error',
        message: error.message
      };
      
      // Axios 에러 처리
      if (error.response) {
        errorResponse.statusCode = error.response.status;
        errorResponse.headers = error.response.headers;
        errorResponse.data = error.response.data;
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify(errorResponse, null, 2) }],
        isError: true
      };
    }
  }
);

// 문서 리소스 추가
server.resource(
  "api-caller-docs",
  "docs://api-caller",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: `# API Caller MCP 서버

이 MCP 서버는 외부 RESTful API를 호출할 수 있는 도구를 제공합니다.

## 사용 가능한 도구

### call_api

외부 RESTful API를 호출합니다.

**파라미터:**

- url (필수): 호출할 API의 URL
- method (선택, 기본값: GET): HTTP 메서드 (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- headers (선택): 요청 헤더 (API 키, 인증 토큰 등)
- params (선택): URL 쿼리 파라미터
- data (선택): 요청 바디 데이터 (POST, PUT, PATCH에서 사용)
- timeout (선택, 기본값: 30000): 요청 타임아웃 (ms 단위)

**반환값:**

성공 시:
\`\`\`json
{
  "status": "success",
  "statusCode": 200,
  "headers": { ... },
  "data": { ... }
}
\`\`\`

실패 시:
\`\`\`json
{
  "status": "error",
  "message": "오류 메시지",
  "statusCode": 404,
  "headers": { ... },
  "data": { ... }
}
\`\`\`
`
    }]
  })
);

// 예제 리소스 추가
server.resource(
  "api-caller-example",
  "examples://api-caller",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: `# API Caller 사용 예제

## 기본 GET 요청
\`\`\`
{
  "url": "https://jsonplaceholder.typicode.com/posts/1"
}
\`\`\`

## 쿼리 파라미터가 있는 GET 요청
\`\`\`
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "params": {
    "userId": 1
  }
}
\`\`\`

## 데이터가 있는 POST 요청
\`\`\`
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
\`\`\`

## 인증 헤더가 있는 요청
\`\`\`
{
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer your_token_here"
  }
}
\`\`\`
`
    }]
  })
);

// 트랜스포트 생성 및 연결
const transport = new StdioServerTransport();

// 오류 처리 설정
process.on('uncaughtException', (err) => {
  console.error(`API Caller MCP Server: Uncaught exception: ${err.message}`);
  console.error(err.stack);
});

// 프로세스 종료 처리
process.on('exit', () => {
  console.error('API Caller MCP Server: Process is exiting');
});

// 서버 연결
server.connect(transport)
  .then(() => {
    console.error('API Caller MCP Server: Successfully connected and ready to receive requests');
  })
  .catch((error) => {
    console.error(`API Caller MCP Server: Failed to connect: ${error.message}`);
    process.exit(1);
  });