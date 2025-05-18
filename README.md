# API Caller MCP Server

MCP (Model Context Protocol) Server: A service that enables calling external RESTful APIs.

## Features

This MCP server provides tools for LLMs like Claude to call external RESTful APIs. It includes the following features:

- Support for various HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Configurable headers, query parameters, and request body data
- Configurable timeout settings
- Error handling and response formatting

## Installation and Execution

### Requirements

- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Build

```bash
# Compile TypeScript
npm run build
```

### Execution

```bash
# Run StdIO version (integrated with MCP clients like Claude Desktop)
npm start

# Run HTTP server version (exposed as API)
npm run start:http

# Run in development mode (direct TypeScript execution)
npm run dev

# Run HTTP server in development mode
npm run dev:http

# Run in watch mode (useful during development)
npm run watch

# Run test client
npm run test
```

## Adding MCP Server to Claude Desktop

### 1. Configure claude_desktop_config.json

Configure the `claude_desktop_config.json` file as follows. Use `npx` to run with dependency installation:

```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "MCP service for calling external RESTful APIs",
  "command": "npx",
  "args": ["--yes", "--package=dotenv", "--package=axios", "--package=@modelcontextprotocol/sdk", "node", "{your_mcp_path}/api_caller/index.js"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Alternative Configuration Options:**

1. **Using Batch File (Recommended):**
```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "MCP service for calling external RESTful APIs",
  "command": "{your_mcp_path}/api_caller/run_with_npx.bat",
  "args": [],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Using npm Script:**
```json
{
  "name": "API Caller",
  "version": "1.0.0",
  "description": "MCP service for calling external RESTful APIs",
  "command": "npx",
  "args": ["--yes", "npm", "run", "start"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

> **Important**: Ensure that file paths match the absolute path of your project folder.

### 2. Add MCP Provider to Claude Desktop

1. **Launch Claude Desktop**: Start the Claude Desktop application.

2. **Open Settings Menu**: 
   - Click the profile icon or settings icon in the bottom left of the Claude Desktop window.
   - Select "Settings" from the menu.

3. **Navigate to MCP Providers Tab**:
   - Find and click on "MCP Providers" or "Tools" tab in the settings menu.

4. **Add New MCP Provider**:
   - Click "Add New MCP Provider" or the "+" button.

5. **Select Configuration File**:
   - In the file selection dialog, navigate to the `claude_desktop_config.json` file.
   - Path: `{your_mcp_path}/api_caller/claude_desktop_config.json`
   - Select this file and click "Open".

6. **Enable MCP Provider**:
   - Once API Caller is added to the list, toggle the switch next to it to enable.

### 3. Troubleshooting

If you encounter connection issues:

1. **Check Dependencies**:
   ```bash
   npm install
   ```

2. **Verify Path Settings**:
   - Ensure all file paths are correctly configured.
   - When using batch file method, verify `run_with_npx.bat` exists.

3. **Permission Issues**:
   - Run command prompt as administrator.

4. **Check Logs**:
   - Check Claude Desktop logs for error messages.
   - Run batch file directly to check for error messages.

5. **Verify npx Installation**:
   ```bash
   npm install -g npx
   ```

6. **Module Format Issues**:
   - If module format issues occur (CommonJS vs ES modules), check `"type": "module"` setting in `package.json`.

## Usage

First, clone the repository:

```bash
git clone https://github.com/g2developer/api_caller_mcp_server.git
cd api_caller_mcp_server
```

This MCP server can be used with LLM clients that support the Model Context Protocol.

### StdIO Interface

Register this server as an MCP provider in clients like Claude Desktop.

### HTTP Interface

The HTTP server version provides the following endpoints:

- `POST /mcp`: Handles requests from MCP clients to the server.
- `GET /mcp`: Sends notifications from server to client via SSE (Server-Sent Events).
- `DELETE /mcp`: Terminates the session.
- `GET /health`: Checks server status.

Use `mcp-session-id` header for session management.

### call_api Tool

Calls external RESTful APIs.

#### Parameters:

- `url` (required): URL of the API to call
- `method` (optional, default: GET): HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- `headers` (optional): Request headers (API keys, auth tokens, etc.)
- `params` (optional): URL query parameters
- `data` (optional): Request body data (for POST, PUT, PATCH)
- `timeout` (optional, default: 30000): Request timeout in milliseconds

#### Return Value:

Success:
```json
{
  "status": "success",
  "statusCode": 200,
  "headers": { ... },
  "data": { ... }
}
```

Failure:
```json
{
  "status": "error",
  "message": "Error message",
  "statusCode": 404,
  "headers": { ... },
  "data": { ... }
}
```

## Examples

### Basic GET Request
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts/1"
}
```

### GET Request with Query Parameters
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "params": {
    "userId": 1
  }
}
```

### POST Request with Data
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

### Request with Authentication Header
```json
{
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer your_token_here"
  }
}
```

## Environment Variables

Configure the following environment variables in `.env` file:

- `PORT`: Port number for HTTP server (default: 3071)
- `NODE_ENV`: Execution environment (development, production, test)
- `DEFAULT_TIMEOUT`: Default API call timeout in milliseconds
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `DEFAULT_API_KEY`: Default API key (if needed)
- `DEFAULT_AUTH_TOKEN`: Default authentication token (if needed)
- `ALLOW_ORIGIN`: CORS settings (default: *)

## License

MIT License
