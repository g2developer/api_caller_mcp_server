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
    url: { type: "string", description: "호출할 API의 URL", required: true },
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
  async (params, url, method, headers, reqParams, data, timeout) => {
    try {
      // 전체 매개변수 객체 로깅
      console.error(`API Caller MCP Server: Received parameters:`, JSON.stringify(params, null, 2));
      console.error(`API Caller MCP Server: Direct parameters:`, { url, method, headers, reqParams, data, timeout });
      
      // 매개변수 가져오기 시도
      if (!url && params && typeof params === 'object') {
        // 객체에서 추출 시도
        const extracted = params.url || params.URL || params.Url;
        if (extracted) {
          console.error(`Found URL in params object: ${extracted}`);
          url = extracted;
        }
      }
      
      // 처음부터 객체로 전달된 경우
      const methodToUse = method || (params && params.method) || "GET";
      const headersToUse = headers || (params && params.headers) || {};
      const queryParams = reqParams || (params && (params.params || params.queryParams)) || {};
      const dataToUse = data || (params && params.data) || {};
      const timeoutToUse = timeout || (params && params.timeout) || 30000;
      
      console.error(`API Caller MCP Server: Making ${methodToUse} request to ${url}`);
      
      // URL이 undefined인 경우 처리
      if (url === undefined) {
        // JSON 형태로 넘어온 경우
        if (typeof params === 'string') {
          try {
            const jsonParams = JSON.parse(params);
            if (jsonParams.url) {
              url = jsonParams.url;
              console.error(`Found URL in JSON string: ${url}`);
            }
          } catch (e) {
            console.error(`Failed to parse JSON string: ${e.message}`);
          }
        }
        
        // 여전히 URL이 없는 경우 오류 발생
        if (url === undefined) {
          throw new Error("URL is undefined or not provided");
        }
      }
      
      // URL 유효성 검증 및 정규화 시도
      let validUrl = url;
      try {
        // URL 디코딩 - 인코딩된 URL 처리
        try {
          if (url.includes('%')) {
            validUrl = decodeURIComponent(url);
            console.error(`Decoded URL: ${validUrl}`);
          }
        } catch (decodeError) {
          console.error(`URL decoding failed, continuing with original URL: ${decodeError.message}`);
        }
        
        // 프로토콜이 없는 경우 http:// 추가
        if (!validUrl.match(/^[a-zA-Z]+:\/\//)) {
          validUrl = `http://${validUrl}`;
          console.error(`Added protocol to URL: ${validUrl}`);
        }
        
        // URL 객체를 생성하여 유효성 검증
        const urlObj = new URL(validUrl);
        validUrl = urlObj.toString();
        console.error(`Validated URL: ${validUrl}`);
      } catch (urlError) {
        console.error(`URL validation warning: ${urlError.message}. Continuing with original URL.`);
        // URL이 유효하지 않더라도 계속 진행 (axios가 처리하도록)
      }
      
      // API 호출 설정
      const config = {
        url: validUrl,
        method: methodToUse.toUpperCase(),
        headers: headersToUse,
        params: queryParams,
        timeout: timeoutToUse,
        // 로컬 서버에 CORS 문제가 발생할 수 있으므로 이를 무시하는 옵션 추가
        withCredentials: false,
        validateStatus: (status) => true, // 모든 상태 코드를 유효하게 처리
        maxRedirects: 5,  // 리다이렉션 허용
        proxy: false      // 프록시 사용 안 함
      };
      
      // 디버깅을 위한 자세한 로깅
      console.error(`Full axios config:`, JSON.stringify(config, null, 2));
      
      // 데이터 추가 (GET, HEAD, OPTIONS 메서드에서는 데이터를 보내지 않음)
      if (!['GET', 'HEAD', 'OPTIONS'].includes(methodToUse.toUpperCase()) && Object.keys(dataToUse).length > 0) {
        config.data = dataToUse;
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
      console.error(`Error stack:`, error.stack);
      
      if (error.config) {
        console.error(`Failed request config:`, JSON.stringify(error.config, null, 2));
      }
      
      if (error.code) {
        console.error(`Error code:`, error.code);
      }
      
      // 오류 응답 준비
      let errorResponse = {
        status: 'error',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
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
