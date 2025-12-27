/**
 * 🔥 Decision Trace System
 * 
 * Captures and stores agent decision-making traces with full context.
 * Enables debugging, explainability, and performance analysis.
 */

export interface DecisionStep {
  timestamp: number;
  stepNumber: number;
  phase: 'analysis' | 'planning' | 'validation' | 'execution' | 'confirmation';
  description: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  reasoning?: string;
  confidence?: number;
  gasEstimate?: string;
  alternatives?: {
    action: string;
    reason: string;
    rejected: boolean;
  }[];
  warnings?: string[];
  errors?: string[];
}

export interface AgentDecisionTrace {
  traceId: string;
  agentType: 'payment' | 'rebalancing' | 'treasury' | 'orchestration';
  scenarioId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  
  status: 'running' | 'success' | 'failed' | 'cancelled';
  
  // Input context
  initialState: {
    balance: string;
    portfolio?: Record<string, string>;
    prices?: Record<string, string>;
    gasPrice: string;
    networkCondition: 'low' | 'medium' | 'high';
  };
  
  // Decision steps
  steps: DecisionStep[];
  
  // Final result
  finalDecision?: {
    action: string;
    parameters: Record<string, any>;
    expectedGas: string;
    confidence: number;
    reasoning: string;
  };
  
  // Performance metrics
  performance: {
    totalSteps: number;
    reasoningTime: number;
    executionTime: number;
    gasUsed?: string;
    gasEfficiency?: number; // actual vs estimated
  };
  
  // Cost breakdown
  costs?: {
    gasCostETH: string;
    gasCostUSD?: string;
    transactionValue: string;
    totalCostUSD?: string;
  };
  
  // Tags for analysis
  tags: string[];
}

/**
 * In-memory trace storage (in production, use database)
 */
class TraceStorage {
  private traces: Map<string, AgentDecisionTrace> = new Map();
  private maxTraces = 1000; // Keep last 1000 traces
  
  store(trace: AgentDecisionTrace): void {
    this.traces.set(trace.traceId, trace);
    
    // Clean up old traces if needed
    if (this.traces.size > this.maxTraces) {
      const oldestKey = this.traces.keys().next().value;
      if (oldestKey) {
        this.traces.delete(oldestKey);
      }
    }
  }
  
  get(traceId: string): AgentDecisionTrace | undefined {
    return this.traces.get(traceId);
  }
  
  getAll(): AgentDecisionTrace[] {
    return Array.from(this.traces.values());
  }
  
  getByAgent(agentType: string): AgentDecisionTrace[] {
    return this.getAll().filter(t => t.agentType === agentType);
  }
  
  getByStatus(status: AgentDecisionTrace['status']): AgentDecisionTrace[] {
    return this.getAll().filter(t => t.status === status);
  }
  
  getRecent(count: number): AgentDecisionTrace[] {
    return this.getAll()
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, count);
  }
  
  clear(): void {
    this.traces.clear();
  }
}

/**
 * Global trace storage instance
 */
export const traceStorage = new TraceStorage();

/**
 * Decision Trace Builder - Fluent API for building traces
 */
export class DecisionTraceBuilder {
  private trace: AgentDecisionTrace;
  private currentStep = 0;
  
  constructor(agentType: AgentDecisionTrace['agentType'], scenarioId?: string) {
    this.trace = {
      traceId: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentType,
      scenarioId,
      startTime: Date.now(),
      status: 'running',
      initialState: {
        balance: '0',
        gasPrice: '0',
        networkCondition: 'medium'
      },
      steps: [],
      performance: {
        totalSteps: 0,
        reasoningTime: 0,
        executionTime: 0
      },
      tags: []
    };
  }
  
  /**
   * Set initial state
   */
  withInitialState(state: Partial<AgentDecisionTrace['initialState']>): this {
    this.trace.initialState = { ...this.trace.initialState, ...state };
    return this;
  }
  
  /**
   * Add a decision step
   */
  addStep(step: Omit<DecisionStep, 'timestamp' | 'stepNumber'>): this {
    this.currentStep++;
    this.trace.steps.push({
      ...step,
      timestamp: Date.now(),
      stepNumber: this.currentStep
    });
    return this;
  }
  
  /**
   * Add analysis phase step
   */
  analyze(description: string, inputs: Record<string, any>, reasoning: string): this {
    return this.addStep({
      phase: 'analysis',
      description,
      inputs,
      reasoning
    });
  }
  
  /**
   * Add planning phase step
   */
  plan(description: string, alternatives: DecisionStep['alternatives']): this {
    return this.addStep({
      phase: 'planning',
      description,
      alternatives
    });
  }
  
  /**
   * Add validation phase step
   */
  validate(description: string, checks: Record<string, boolean>, warnings?: string[]): this {
    return this.addStep({
      phase: 'validation',
      description,
      outputs: checks,
      warnings
    });
  }
  
  /**
   * Add execution phase step
   */
  execute(description: string, gasEstimate: string, confidence: number): this {
    return this.addStep({
      phase: 'execution',
      description,
      gasEstimate,
      confidence
    });
  }
  
  /**
   * Add error
   */
  addError(phase: DecisionStep['phase'], error: string): this {
    const lastStep = this.trace.steps[this.trace.steps.length - 1];
    if (lastStep && lastStep.phase === phase) {
      lastStep.errors = [...(lastStep.errors || []), error];
    } else {
      return this.addStep({
        phase,
        description: 'Error occurred',
        errors: [error]
      });
    }
    return this;
  }
  
  /**
   * Set final decision
   */
  decide(decision: AgentDecisionTrace['finalDecision']): this {
    this.trace.finalDecision = decision;
    return this;
  }
  
  /**
   * Mark as successful
   */
  succeed(gasUsed?: string): this {
    this.trace.status = 'success';
    this.trace.endTime = Date.now();
    this.trace.duration = this.trace.endTime - this.trace.startTime;
    
    if (gasUsed) {
      this.trace.performance.gasUsed = gasUsed;
      
      // Calculate gas efficiency
      if (this.trace.finalDecision?.expectedGas) {
        const expected = parseInt(this.trace.finalDecision.expectedGas);
        const actual = parseInt(gasUsed);
        this.trace.performance.gasEfficiency = (expected / actual) * 100;
      }
    }
    
    return this;
  }
  
  /**
   * Mark as failed
   */
  fail(error: string): this {
    this.trace.status = 'failed';
    this.trace.endTime = Date.now();
    this.trace.duration = this.trace.endTime - this.trace.startTime;
    this.addError('execution', error);
    return this;
  }
  
  /**
   * Add tags
   */
  tag(...tags: string[]): this {
    this.trace.tags.push(...tags);
    return this;
  }
  
  /**
   * Build and store trace
   */
  build(): AgentDecisionTrace {
    this.trace.performance.totalSteps = this.trace.steps.length;
    this.trace.performance.reasoningTime = this.trace.steps
      .filter(s => s.phase === 'analysis' || s.phase === 'planning')
      .length * 100; // Approximate
    
    // Store trace
    traceStorage.store(this.trace);
    
    return this.trace;
  }
  
  /**
   * Get trace ID without building
   */
  getTraceId(): string {
    return this.trace.traceId;
  }
}

/**
 * Trace analytics utilities
 */
export class TraceAnalytics {
  /**
   * Get average execution time by agent type
   */
  static getAverageExecutionTime(agentType: string): number {
    const traces = traceStorage.getByAgent(agentType);
    if (traces.length === 0) return 0;
    
    const total = traces.reduce((sum, t) => sum + (t.duration || 0), 0);
    return total / traces.length;
  }
  
  /**
   * Get success rate by agent type
   */
  static getSuccessRate(agentType: string): number {
    const traces = traceStorage.getByAgent(agentType);
    if (traces.length === 0) return 0;
    
    const successful = traces.filter(t => t.status === 'success').length;
    return (successful / traces.length) * 100;
  }
  
  /**
   * Get average gas used by agent type
   */
  static getAverageGasUsed(agentType: string): string {
    const traces = traceStorage.getByAgent(agentType)
      .filter(t => t.performance.gasUsed);
    
    if (traces.length === 0) return '0';
    
    const total = traces.reduce((sum, t) => 
      sum + parseInt(t.performance.gasUsed || '0'), 0
    );
    
    return Math.floor(total / traces.length).toString();
  }
  
  /**
   * Get traces with performance issues
   */
  static getSlowTraces(thresholdMs: number = 1000): AgentDecisionTrace[] {
    return traceStorage.getAll()
      .filter(t => (t.duration || 0) > thresholdMs)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }
  
  /**
   * Get traces with gas inefficiency
   */
  static getGasInefficientTraces(thresholdPercent: number = 80): AgentDecisionTrace[] {
    return traceStorage.getAll()
      .filter(t => t.performance.gasEfficiency && t.performance.gasEfficiency < thresholdPercent)
      .sort((a, b) => (a.performance.gasEfficiency || 100) - (b.performance.gasEfficiency || 100));
  }
  
  /**
   * Get summary statistics
   */
  static getSummaryStats() {
    const allTraces = traceStorage.getAll();
    const successful = allTraces.filter(t => t.status === 'success');
    const failed = allTraces.filter(t => t.status === 'failed');
    
    return {
      total: allTraces.length,
      successful: successful.length,
      failed: failed.length,
      successRate: allTraces.length > 0 ? (successful.length / allTraces.length) * 100 : 0,
      
      averageDuration: allTraces.length > 0 
        ? allTraces.reduce((sum, t) => sum + (t.duration || 0), 0) / allTraces.length 
        : 0,
      
      totalGasUsed: allTraces
        .reduce((sum, t) => sum + parseInt(t.performance.gasUsed || '0'), 0)
        .toString(),
      
      byAgent: {
        payment: traceStorage.getByAgent('payment').length,
        rebalancing: traceStorage.getByAgent('rebalancing').length,
        treasury: traceStorage.getByAgent('treasury').length,
        orchestration: traceStorage.getByAgent('orchestration').length
      }
    };
  }
}

/**
 * Export utilities for easy access
 */
export const createTrace = (
  agentType: AgentDecisionTrace['agentType'], 
  scenarioId?: string
) => new DecisionTraceBuilder(agentType, scenarioId);

export { traceStorage as traces };
