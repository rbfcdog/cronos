/**
 * Execution Trace Builder
 * 
 * Builds detailed execution traces for observability and debugging.
 */

import {
  ExecutionTrace,
  ActionResult,
  VirtualState,
  ExecutionMode,
  ExecutionAction,
} from "./types";
import { stateManager } from "./state";

export class TraceBuilder {
  private traces: Map<string, ExecutionTrace> = new Map();

  /**
   * Initialize a new trace for a run
   */
  createTrace(
    runId: string,
    planId: string | undefined,
    mode: ExecutionMode,
    virtualState: VirtualState
  ): ExecutionTrace {
    const trace: ExecutionTrace = {
      runId,
      planId,
      mode,
      status: "pending",
      steps: [],
      virtualState,
      warnings: [],
      errors: [],
      metadata: {
        startTime: Date.now(),
      },
    };

    this.traces.set(runId, trace);
    return trace;
  }

  /**
   * Get trace for a run
   */
  getTrace(runId: string): ExecutionTrace | undefined {
    return this.traces.get(runId);
  }

  /**
   * Start execution (update status)
   */
  startExecution(runId: string): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.status = "running";
    }
  }

  /**
   * Add a step result to the trace
   */
  addStep(runId: string, result: ActionResult): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.steps.push(result);
      
      // Update virtual state snapshot
      const currentState = stateManager.getState(runId);
      if (currentState) {
        trace.virtualState = { ...currentState };
      }
    }
  }

  /**
   * Add a warning to the trace
   */
  addWarning(runId: string, warning: string): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.warnings.push(warning);
    }
  }

  /**
   * Add an error to the trace
   */
  addError(runId: string, error: string): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.errors.push(error);
    }
  }

  /**
   * Complete execution successfully
   */
  completeExecution(runId: string): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.status = "completed";
      trace.metadata.endTime = Date.now();
      trace.metadata.duration = trace.metadata.endTime - trace.metadata.startTime;
    }
  }

  /**
   * Fail execution
   */
  failExecution(runId: string, error: string): void {
    const trace = this.traces.get(runId);
    if (trace) {
      trace.status = "failed";
      trace.errors.push(error);
      trace.metadata.endTime = Date.now();
      trace.metadata.duration = trace.metadata.endTime - trace.metadata.startTime;
    }
  }

  /**
   * Get agent-friendly trace summary
   */
  getTraceSummary(runId: string): any {
    const trace = this.traces.get(runId);
    if (!trace) return null;

    const successCount = trace.steps.filter(s => s.status === "success" || s.status === "simulated").length;
    const failCount = trace.steps.filter(s => s.status === "error").length;

    return {
      runId: trace.runId,
      status: trace.status,
      steps: trace.steps.map(step => ({
        action: step.action.type,
        status: step.status,
        result: step.result,
        gas: step.gasEstimate || step.gasUsed,
        txHash: step.txHash,
        error: step.error,
      })),
      summary: {
        totalSteps: trace.steps.length,
        successful: successCount,
        failed: failCount,
      },
      warnings: trace.warnings,
      errors: trace.errors,
      duration: trace.metadata.duration ? `${trace.metadata.duration}ms` : undefined,
    };
  }

  /**
   * Get all traces (for listing)
   */
  getAllTraces(): ExecutionTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Clear old traces (memory management)
   */
  clearOldTraces(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [runId, trace] of this.traces.entries()) {
      if (now - trace.metadata.startTime > maxAgeMs) {
        this.traces.delete(runId);
      }
    }
  }
}

export const traceBuilder = new TraceBuilder();
