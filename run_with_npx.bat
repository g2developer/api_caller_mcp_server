@echo off
cd /d D:\claude\my_mcp\api_caller

echo [%date% %time%] Starting API Caller MCP Server > logs.txt
npx --yes --package=dotenv --package=axios --package=@modelcontextprotocol/sdk node index.js 2>> logs.txt