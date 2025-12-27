/**
 * x402 Agent Platform - Core Type Definitions
 * 
 * Shared types across Testing Studio, Observability Dashboard, and Orchestration Runtime
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  config: AgentConfig;
  createdAt: number;
  lastActiveAt: number;
  metrics: AgentMetrics;
}

export enum AgentType {
  DeFi = "defi",
  Trading = "trading",
  Risk = "risk",
  Governance = "governance",
  Custom = "custom",
}

export enum AgentStatus {
  Active = "active",
  Paused = "paused",
  Error = "error",
  Testing = "testing",
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model?: string;
  chainId?: number;
  context?: any[];
  customRPC?: string;
  enableTracing?: boolean;
  maxGasPerTransaction?: string;
  riskTolerance?: "low" | "medium" | "high";
}

export interface AgentMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageExecutionTime: number;
  totalGasUsed: string;
  lastError?: string;
}

// ============================================================================
// TESTING TYPES
// ============================================================================

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  agentId: string;
  setup: TestSetup;
  assertions: TestAssertion[];
  createdAt: number;
  lastRunAt?: number;
  status?: TestStatus;
}

export enum TestCategory {
  Payment = "payment",
  DeFi = "defi",
  Risk = "risk",
  Gas = "gas",
  Security = "security",
  Integration = "integration",
}

export enum TestStatus {
  Passed = "passed",
  Failed = "failed",
  Running = "running",
  Pending = "pending",
}

export interface TestSetup {
  initialBalance?: string;
  contracts?: ContractSetup[];
  tokens?: TokenSetup[];
  conditions?: Record<string, any>;
}

export interface ContractSetup {
  address: string;
  abi: any[];
  initialState?: Record<string, any>;
}

export interface TokenSetup {
  symbol: string;
  address: string;
  decimals: number;
  initialBalance: string;
}

export interface TestAssertion {
  type: AssertionType;
  expected: any;
  actual?: any;
  message: string;
  passed?: boolean;
}

export enum AssertionType {
  Balance = "balance",
  GasLimit = "gasLimit",
  TransactionSuccess = "transactionSuccess",
  StateChange = "stateChange",
  EventEmitted = "eventEmitted",
  Custom = "custom",
}

export interface TestResult {
  scenarioId: string;
  status: TestStatus;
  assertions: TestAssertion[];
  executionTime: number;
  gasUsed?: string;
  error?: string;
  trace?: any;
  timestamp: number;
}

// ============================================================================
// OBSERVABILITY TYPES
// ============================================================================

export interface Transaction {
  hash: string;
  agentId: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: TransactionStatus;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  metadata?: TransactionMetadata;
}

export enum TransactionStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Failed = "failed",
}

export interface TransactionMetadata {
  agentDecision?: string;
  reasoning?: string;
  riskScore?: number;
  alternativesConsidered?: number;
}

export interface Metric {
  name: string;
  value: number | string;
  unit: string;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface DecisionTrace {
  id: string;
  agentId: string;
  query: string;
  steps: DecisionStep[];
  result: any;
  timestamp: number;
  executionTime: number;
  llmCalls: number;
  totalTokens?: number;
}

export interface DecisionStep {
  step: number;
  action: string;
  reasoning: string;
  result: any;
  timestamp: number;
  gasEstimate?: string;
}

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  agents: string[]; // Agent IDs
  steps: WorkflowStep[];
  status: WorkflowStatus;
  createdAt: number;
  lastExecutedAt?: number;
}

export enum WorkflowStatus {
  Draft = "draft",
  Active = "active",
  Paused = "paused",
  Completed = "completed",
  Failed = "failed",
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  dependencies?: string[]; // Step IDs that must complete first
  condition?: string;
  status?: StepStatus;
}

export enum StepStatus {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
  Skipped = "skipped",
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  status: WorkflowStatus;
  steps: WorkflowStepExecution[];
  totalGasUsed?: string;
  error?: string;
}

export interface WorkflowStepExecution {
  stepId: string;
  agentId: string;
  startTime: number;
  endTime?: number;
  status: StepStatus;
  result?: any;
  error?: string;
  gasUsed?: string;
}

// ============================================================================
// GAS PROFILING TYPES
// ============================================================================

export interface GasProfile {
  scenarioId: string;
  totalGas: string;
  breakdown: GasBreakdown[];
  averageGasPrice: string;
  estimatedCost: string; // In CRO
  timestamp: number;
}

export interface GasBreakdown {
  operation: string;
  gasUsed: string;
  percentage: number;
  optimizationSuggestion?: string;
}

// ============================================================================
// FUZZING TYPES
// ============================================================================

export interface FuzzTest {
  id: string;
  name: string;
  agentId: string;
  parameters: FuzzParameter[];
  iterations: number;
  status: FuzzStatus;
  results?: FuzzResult[];
  createdAt: number;
  completedAt?: number;
}

export enum FuzzStatus {
  Running = "running",
  Completed = "completed",
  Failed = "failed",
  Stopped = "stopped",
}

export interface FuzzParameter {
  name: string;
  type: "number" | "address" | "string" | "boolean";
  min?: number;
  max?: number;
  options?: any[];
}

export interface FuzzResult {
  iteration: number;
  inputs: Record<string, any>;
  output: any;
  success: boolean;
  error?: string;
  gasUsed?: string;
  uniqueBehavior?: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface PlatformEvent {
  id: string;
  type: EventType;
  source: string;
  data: any;
  timestamp: number;
}

export enum EventType {
  AgentCreated = "agent.created",
  AgentQuery = "agent.query",
  TestStarted = "test.started",
  TestCompleted = "test.completed",
  TransactionDetected = "transaction.detected",
  WorkflowStarted = "workflow.started",
  WorkflowCompleted = "workflow.completed",
  MetricRecorded = "metric.recorded",
  Error = "error",
}
