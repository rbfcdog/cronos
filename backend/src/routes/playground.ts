/**
 * Playground API Routes
 * 
 * LLM/Agent-friendly endpoints for simulation and execution.
 */

import { Router, Request, Response } from "express";
import { playgroundRunner } from "../playground/runner";
import { traceBuilder } from "../playground/trace";
import { stateManager } from "../playground/state";
import {
  ExecutionPlan,
  PlaygroundResponse,
  SimulationResult,
  ExecutionResult,
} from "../playground/types";

const router = Router();

/**
 * POST /api/playground/simulate
 * 
 * Simulate an execution plan without sending real transactions.
 * Returns gas estimates and state changes.
 */
router.post("/simulate", async (req: Request, res: Response) => {
  try {
    const plan: ExecutionPlan = req.body;

    // Validate plan
    if (!plan.actions || !Array.isArray(plan.actions)) {
      return res.status(400).json({
        success: false,
        error: "Invalid execution plan: actions array required",
        timestamp: Date.now(),
      } as PlaygroundResponse);
    }

    // Force simulate mode
    plan.mode = "simulate";

    // Run simulation
    const result = await playgroundRunner.run(plan) as SimulationResult;

    const response: PlaygroundResponse<SimulationResult> = {
      success: result.success,
      data: result,
      trace: result.trace,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    console.error("Simulation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Simulation failed",
      timestamp: Date.now(),
    } as PlaygroundResponse);
  }
});

/**
 * POST /api/playground/execute
 * 
 * Execute a plan with real blockchain transactions.
 * WARNING: This sends real transactions on Cronos testnet.
 */
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const plan: ExecutionPlan = req.body;

    // Validate plan
    if (!plan.actions || !Array.isArray(plan.actions)) {
      return res.status(400).json({
        success: false,
        error: "Invalid execution plan: actions array required",
        timestamp: Date.now(),
      } as PlaygroundResponse);
    }

    // Force execute mode
    plan.mode = "execute";

    // Run real execution
    const result = await playgroundRunner.run(plan) as ExecutionResult;

    const response: PlaygroundResponse<ExecutionResult> = {
      success: result.success,
      data: result,
      trace: result.trace,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    console.error("Execution error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Execution failed",
      timestamp: Date.now(),
    } as PlaygroundResponse);
  }
});

/**
 * GET /api/playground/runs/:runId
 * 
 * Retrieve trace and state for a specific run.
 */
router.get("/runs/:runId", (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    const trace = traceBuilder.getTrace(runId);
    const state = stateManager.getState(runId);

    if (!trace) {
      return res.status(404).json({
        success: false,
        error: `Run ${runId} not found`,
        timestamp: Date.now(),
      } as PlaygroundResponse);
    }

    const response: PlaygroundResponse = {
      success: true,
      data: {
        trace,
        state,
        summary: traceBuilder.getTraceSummary(runId),
        stateSummary: stateManager.getStateSummary(runId),
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    console.error("Retrieve run error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve run",
      timestamp: Date.now(),
    } as PlaygroundResponse);
  }
});

/**
 * GET /api/playground/runs
 * 
 * List all traces (for debugging/inspection).
 */
router.get("/runs", (req: Request, res: Response) => {
  try {
    const traces = traceBuilder.getAllTraces();
    
    const summaries = traces.map(trace => ({
      runId: trace.runId,
      planId: trace.planId,
      mode: trace.mode,
      status: trace.status,
      stepsCount: trace.steps.length,
      errors: trace.errors.length,
      warnings: trace.warnings.length,
      startTime: new Date(trace.metadata.startTime).toISOString(),
      duration: trace.metadata.duration ? `${trace.metadata.duration}ms` : undefined,
    }));

    const response: PlaygroundResponse = {
      success: true,
      data: {
        total: summaries.length,
        runs: summaries,
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    console.error("List runs error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to list runs",
      timestamp: Date.now(),
    } as PlaygroundResponse);
  }
});

/**
 * POST /api/playground/validate
 * 
 * Validate an execution plan without running it.
 */
router.post("/validate", (req: Request, res: Response) => {
  try {
    const plan: ExecutionPlan = req.body;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate structure
    if (!plan.actions || !Array.isArray(plan.actions)) {
      errors.push("Missing or invalid 'actions' array");
    }

    if (!plan.mode || !["simulate", "execute"].includes(plan.mode)) {
      errors.push("Invalid or missing 'mode' (must be 'simulate' or 'execute')");
    }

    // Validate each action
    if (plan.actions) {
      plan.actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`Action ${index}: missing 'type'`);
        }

        // Type-specific validation
        switch (action.type) {
          case "x402_payment":
            if (!action.to) errors.push(`Action ${index}: missing 'to' address`);
            if (!action.amount) errors.push(`Action ${index}: missing 'amount'`);
            break;
          
          case "contract_call":
            if (!action.contract) errors.push(`Action ${index}: missing 'contract'`);
            if (!action.method) errors.push(`Action ${index}: missing 'method'`);
            break;
          
          case "read_balance":
            // Optional: token defaults to TCRO
            break;
        }

        // Warn about execute mode
        if (plan.mode === "execute" && action.type === "x402_payment") {
          warnings.push(`Action ${index}: Will send real transaction on Cronos testnet`);
        }
      });
    }

    const isValid = errors.length === 0;

    const response: PlaygroundResponse = {
      success: isValid,
      data: {
        valid: isValid,
        errors,
        warnings,
        actionsCount: plan.actions?.length || 0,
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error: any) {
    console.error("Validation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Validation failed",
      timestamp: Date.now(),
    } as PlaygroundResponse);
  }
});

/**
 * GET /api/playground/health
 * 
 * Health check for playground subsystem.
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "operational",
      features: {
        simulation: true,
        execution: true,
        tracing: true,
        stateManagement: true,
      },
    },
    timestamp: Date.now(),
  } as PlaygroundResponse);
});

export default router;
