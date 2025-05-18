import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3071;

// Initialize express app
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Function to create and configure a new MCP server
function createMcpServer() {
  const server = new McpServer({
    name: "API Caller",
    version: "1.0.0",
  });

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
      data: z.any().optional()
        .describe("요청 바디 데이터 (POST, PUT, PATCH에서 사용)"),
      timeout: z.number().optional()
        .describe("요청 타임아웃 (ms 단위)"),
    },
    async (params: any) => {
      try {
        // 전체 매개변수 객체 로깅
        console.log(`API Caller MCP Server: Received parameters:`, JSON.stringify(params, null, 2));
        
        const { url, method = "GET", headers = {}, params: queryParams = {}, data = {}, timeout = 30000 } = params;
        
        console.log(`API Caller MCP Server: Making ${method} request to ${url}`);
        
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
              console.log(`Decoded URL: ${validUrl}`);
            }
          } catch (decodeError: any) {
            console.warn(`URL decoding failed, continuing with original URL: ${decodeError.message}`);
          }
          
          // 프로토콜이 없는 경우 http:// 추가
          if (!validUrl.match(/^[a-zA-Z]+:\/\//)) {
            validUrl = `http://${validUrl}`;
            console.log(`Added protocol to URL: ${validUrl}`);
          }
          
          // URL 객체를 생성하여 유효성 검증
          const urlObj = new URL(validUrl);
          validUrl = urlObj.toString();
          console.log(`Validated URL: ${validUrl}`);
        } catch (urlError) {
          console.warn(`URL validation warning: ${urlError instanceof Error ? urlError.message : 'Unknown error'}. Continuing with original URL.`);
          // URL이 유효하지 않더라도 계속 진행 (axios가 처리하도록)
        }
        
        // API call configuration
        const config: any = {
          url: validUrl,
          method: method.toUpperCase(),
          headers,
          params: queryParams,
          timeout,
          // 로컬 서버에 CORS 문제가 발생할 수 있으므로 이를 무시하는 옵션 추가
          withCredentials: false,
          validateStatus: (status: number) => true, // 모든 상태 코드를 유효하게 처리
          maxRedirects: 5,  // 리다이렉션 허용
          proxy: false      // 프록시 사용 안 함
        };
        
        // Add data for non-GET requests
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
          config.data = data;
        }
        
        // 디버깅을 위한 자세한 로깅
        console.log(`Full axios config:`, JSON.stringify(config, null, 2));
        
        // Make the API call
        const response = await axios(config);
        
        // 응답 로깅
        console.log(`API Response status: ${response.status}`);
        console.log(`API Response headers:`, response.headers);
        
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
        
        // Prepare error response
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





  return server;
}

// Helper function to check if a request is an initialize request
function isInitializeRequest(body: any): boolean {
  return body?.jsonrpc === "2.0" && 
         body?.method === "initialize" && 
         typeof body?.id !== "undefined";
}

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    console.log("Creating new MCP session");
    
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        // Store the transport by session ID
        console.log(`Initialized new session: ${sid}`);
        transports[sid] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`Closing session: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };

    // Create and connect MCP server
    const server = createMcpServer();
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    console.error("Error handling request:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  
  try {
    await transport.handleRequest(req, res);
  } catch (error: any) {
    console.error("Error handling session request:", error);
    
    if (!res.headersSent) {
      res.status(500).send('Internal server error');
    }
  }
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    activeSessions: Object.keys(transports).length,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Caller MCP HTTP Server running on port ${PORT}`);
});
