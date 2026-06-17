import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createEvaMcpServer } from "./mcp-server.js";

const server = createEvaMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
