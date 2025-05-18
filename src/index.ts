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
  async (params: any) => {
    try {
      // 전체 매개변수 객체 로깅
      console.error(`API Caller MCP Server: Received parameters:`, JSON.stringify(params, null, 2));
      
      const { url, method = "GET", headers = {}, params: queryParams = {}, data = {}, timeout = 30000 } = params;
      
      console.error(`API Caller MCP Server: Making ${method} request to ${url}`);
      
      // URL이 undefined인 경우 처리
      if (url === undefined) {
        throw new Error("URL is undefined or not provided");
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
        } catch (decodeError: any) {
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
        console.error(`URL validation warning: ${urlError instanceof Error ? urlError.message : 'Unknown error'}. Continuing with original URL.`);
        // URL이 유효하지 않더라도 계속 진행 (axios가 처리하도록)
      }
      
      // API 호출 설정
      const config: any = {
        url: validUrl,
        method: method.toUpperCase(),
        headers,
        params: queryParams,
        timeout,
        // 로컬 서버에 CORS 문제가 발생할 수 있으므로 이를 무시하는 옵션 추가
        withCredentials: false,
        validateStatus: () => true, // 모든 상태 코드를 유효하게 처리
        maxRedirects: 5,  // 리다이렉션 허용
        proxy: false      // 프록시 사용 안 함
      };
      
      // 디버깅을 위한 자세한 로깅
      console.error(`Full axios config:`, JSON.stringify(config, null, 2));
      
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
      console.error(`Error stack:`, error.stack);
      
      if (error.config) {
        console.error(`Failed request config:`, JSON.stringify(error.config, null, 2));
      }
      
      if (error.code) {
        console.error(`Error code:`, error.code);
      }
      
      // 오류 응답 준비
      let errorResponse: any = {
        status: 'error',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
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
