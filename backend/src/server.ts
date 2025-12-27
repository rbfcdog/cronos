import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import config from "./config";
import cronosService from "./services/cronos.service";
import executeRouter from "./routes/execute";
import playgroundRouter from "./routes/playground";
import agentsRouter from "./api/agents";
import tracesRouter from "./routes/traces";

// Load .env from root directory (one level up from backend)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = config.backend.port;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Status endpoint
app.get("/status", async (req: Request, res: Response) => {
  try {
    const networkInfo = await cronosService.getNetworkInfo();
    const executorAddress = cronosService.getExecutorAddress();
    const executorBalance = await cronosService.getBalance(executorAddress);

    res.json({
      status: "operational",
      network: networkInfo,
      executor: {
        address: executorAddress,
        balance: executorBalance + " CRO",
      },
      contracts: {
        executionRouter: config.contracts.executionRouter || "Not deployed",
        treasuryVault: config.contracts.treasuryVault || "Not deployed",
        attestationRegistry: config.contracts.attestationRegistry || "Not deployed",
      },
      configuration: {
        aiProvider: config.ai.provider,
        x402Enabled: !!config.x402.apiKey,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Balance check endpoint
app.get("/balance/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const balance = await cronosService.getBalance(address);
    
    res.json({
      address,
      balance: balance + " CRO",
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Execution routes
app.use("/execute", executeRouter);

// Playground routes (x402 Agent Playground)
app.use("/api/playground", playgroundRouter);

// AI Agents routes (NEW - Crypto.com AI Agent SDK Integration)
app.use("/api/agents", agentsRouter);

// Trace observability routes (NEW - Decision Trace System)
app.use("/api", tracesRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Start server
async function startServer() {
  try {
    // Validate configuration
    const isValid = config.validate();
    
    if (!isValid) {
      console.warn("\n⚠️  Configuration incomplete. Some features may not work.\n");
    }

    // Check network connectivity
    const networkInfo = await cronosService.getNetworkInfo();
    console.log("\n✅ Connected to Cronos:");
    console.log(`   Chain ID: ${networkInfo.chainId}`);
    console.log(`   Block Number: ${networkInfo.blockNumber}`);
    console.log(`   Gas Price: ${networkInfo.gasPrice} wei\n`);

    // Start listening
    app.listen(PORT, () => {
      console.log("=".repeat(60));
      console.log(`🚀 Atlas402 Backend Server`);
      console.log("=".repeat(60));
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Environment: ${config.backend.nodeEnv}`);
      console.log(`\nEndpoints:`);
      console.log(`  GET  /health`);
      console.log(`  GET  /status`);
      console.log(`  GET  /balance/:address`);
      console.log(`  POST /execute/payment`);
      console.log(`  POST /execute/contract`);
      console.log(`  `);
      console.log(`  AI Agents (NEW):`);
      console.log(`  POST /api/agents/create`);
      console.log(`  POST /api/agents/:agentId/query`);
      console.log(`  GET  /api/agents`);
      console.log(`  POST /api/agents/presets/risk-analyzer`);
      console.log(`  POST /api/agents/presets/defi-agent`);
      console.log(`  POST /api/agents/presets/payment-agent`);
      console.log(`  `);
      console.log(`  Trace Observability (NEW):`);
      console.log(`  GET  /api/traces`);
      console.log(`  GET  /api/traces/recent`);
      console.log(`  GET  /api/traces/:traceId`);
      console.log(`  GET  /api/traces/analytics/summary`);
      console.log(`  GET  /api/traces/analytics/agent/:agentType`);
      console.log(`  GET  /api/traces/analytics/timeline`);
      console.log("=".repeat(60));
    });
  } catch (error: any) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
