import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize MCP Server
const server = new McpServer({
  name: "API Caller",
  version: "1.0.0",
});

console.error('API Caller MCP Server starting...');

// Define the call_api tool
server.tool(
  "call_api",
  {
    url: z.string().describe("호출할 API의 URL"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
      .default("GET")
      .describe("HTTP 메서드 (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)"),
    headers: z.record(z.string()).optional()
      .describe("요청 헤더 (API 키, 인증 토큰 등)"),
    params: z.record(z.any()).optional()
      .describe("URL 쿼리 파라미터"),
    data: z.record(z.any()).optional()
      .describe("요청 바디 데이터 (POST, PUT, PATCH에서 사용)"),
    timeout: z.number().optional()
      .describe("요청 타임아웃 (ms 단위)"),
  },
  async ({ url, method = "GET", headers = {}, params = {}, data = {}, timeout = 30000 }) => {
    try {
      console.error(`API Caller MCP Server: Making ${method} request to ${url}`);
      
      // API call configuration
      const config: any = {
        url,
        method: method.toUpperCase(),
        headers,
        params,
        timeout,
      };
      
      // Add data for non-GET requests
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && Object.keys(data).length > 0) {
        config.data = data;
      }
      
      // Make the API call
      const response = await axios(config);
      
      // Prepare response
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
    } catch (error: any) {
      console.error(`API Caller MCP Server: Error in API call: ${error.message}`);
      
      // Prepare error response
      let errorResponse: any = {
        status: 'error',
        message: error.message
      };
      
      // Handle Axios errors
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

// Add a documentation resource
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

// Add an example resource
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

// Create and connect the transport
const transport = new StdioServerTransport();

// Set up error handling
process.on('uncaughtException', (err) => {
  console.error(`API Caller MCP Server: Uncaught exception: ${err.message}`);
  console.error(err.stack);
});

// Handle process exit
process.on('exit', () => {
  console.error('API Caller MCP Server: Process is exiting');
});

// Connect the server
server.connect(transport)
  .then(() => {
    console.error('API Caller MCP Server: Successfully connected and ready to receive requests');
  })
  .catch((error: Error) => {
    console.error(`API Caller MCP Server: Failed to connect: ${error.message}`);
    process.exit(1);
  });
