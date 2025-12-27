"use client";

import { Activity, TrendingUp, Wallet, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { ExecutionTrace } from "@/lib/types";

interface AgentDashboardProps {
  trace: ExecutionTrace | null;
  agentType?: "recurring-payment" | "portfolio-rebalancing" | "treasury-management" | "multi-agent";
}

export default function AgentDashboard({ trace, agentType }: AgentDashboardProps) {
  if (!trace || !agentType) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Execute a workflow to see agent-specific metrics</p>
      </div>
    );
  }

  // Extract metrics from trace context
  const context = trace.steps[0]?.action?.description || "";
  const agentContext = trace.virtualState as any;

  // Render different dashboards based on agent type
  switch (agentType) {
    case "recurring-payment":
      return <RecurringPaymentDashboard trace={trace} context={agentContext} />;
    case "portfolio-rebalancing":
      return <PortfolioRebalancingDashboard trace={trace} context={agentContext} />;
    case "treasury-management":
      return <TreasuryManagementDashboard trace={trace} context={agentContext} />;
    case "multi-agent":
      return <MultiAgentDashboard trace={trace} context={agentContext} />;
    default:
      return <GenericDashboard trace={trace} />;
  }
}

// Recurring Payment Agent Dashboard
function RecurringPaymentDashboard({ trace, context }: { trace: ExecutionTrace; context: any }) {
  const successfulPayments = trace.steps.filter(
    (step) => step.action.type === "x402_payment" && step.status === "success"
  ).length;
  
  const totalPayments = trace.steps.filter(
    (step) => step.action.type === "x402_payment"
  ).length;

  const totalAmount = trace.steps
    .filter((step) => step.action.type === "x402_payment" && step.status === "success")
    .reduce((sum, step) => sum + parseFloat(step.action.amount || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">💰 Recurring Payment Agent</h3>
          <p className="text-xs text-gray-500">Automated payment execution & scheduling</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Payments Executed"
          value={`${successfulPayments}/${totalPayments}`}
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          label="Total Amount"
          value={`${totalAmount.toFixed(2)} USDC`}
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
        />
        <MetricCard
          label="Success Rate"
          value={`${totalPayments > 0 ? Math.round((successfulPayments / totalPayments) * 100) : 0}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="purple"
        />
        <MetricCard
          label="Execution Time"
          value={trace.metadata?.executionTime || "N/A"}
          icon={<Clock className="w-4 h-4" />}
          color="gray"
        />
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Payment Schedule Status</h4>
        <div className="space-y-2">
          {trace.steps
            .filter((step) => step.action.type === "x402_payment")
            .map((step, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Payment to {step.action.to?.slice(0, 10)}...
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{step.action.amount} {step.action.token || "USDC"}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    step.status === "success" ? "bg-green-500/20 text-green-400" :
                    step.status === "error" ? "bg-red-500/20 text-red-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {step.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Portfolio Rebalancing Agent Dashboard
function PortfolioRebalancingDashboard({ trace, context }: { trace: ExecutionTrace; context: any }) {
  const swapActions = trace.steps.filter(
    (step) => step.action.type === "contract_call" && step.action.method?.includes("swap")
  );

  const portfolioHealth = 85; // Mock - would be calculated from actual portfolio data
  const totalValue = "$12,450"; // Mock
  const drift = "3.2%"; // Mock

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">📊 Portfolio Rebalancing Agent</h3>
          <p className="text-xs text-gray-500">DeFi portfolio optimization on VVS Finance</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Portfolio Health"
          value={`${portfolioHealth}/100`}
          icon={<Activity className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          label="Total Value"
          value={totalValue}
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
        />
        <MetricCard
          label="Current Drift"
          value={drift}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="yellow"
        />
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Target vs. Current Allocation</h4>
        <div className="space-y-3">
          <AllocationBar label="CRO" target={50} current={47} />
          <AllocationBar label="USDC" target={30} current={33} />
          <AllocationBar label="VVS" target={20} current={20} />
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Rebalancing Actions</h4>
        <div className="space-y-2 text-sm">
          {swapActions.length > 0 ? (
            swapActions.map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-400">Swap executed</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  step.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {step.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-xs">No rebalancing needed - portfolio within target drift</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Treasury Management Agent Dashboard
function TreasuryManagementDashboard({ trace, context }: { trace: ExecutionTrace; context: any }) {
  const runway = "180 days"; // Mock
  const idleFunds = "15%"; // Mock
  const yieldEarned = "$1,245"; // Mock
  const totalTreasury = "$125,000"; // Mock

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">🏦 Treasury Management Agent</h3>
          <p className="text-xs text-gray-500">Enterprise DAO treasury automation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Treasury Runway"
          value={runway}
          icon={<Clock className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          label="Total Treasury"
          value={totalTreasury}
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
        />
        <MetricCard
          label="Idle Funds"
          value={idleFunds}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="yellow"
        />
        <MetricCard
          label="Yield Earned"
          value={yieldEarned}
          icon={<TrendingUp className="w-4 h-4" />}
          color="purple"
        />
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Wallet Distribution</h4>
        <div className="space-y-3">
          <WalletBar label="Main Treasury" amount="$50,000" percentage={40} />
          <WalletBar label="Operating Wallet" amount="$25,000" percentage={20} />
          <WalletBar label="Reserve Wallet" amount="$37,500" percentage={30} />
          <WalletBar label="Yield Wallet" amount="$12,500" percentage={10} />
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Treasury Actions</h4>
        <div className="space-y-2 text-sm">
          {trace.steps
            .filter((step) => step.status === "success")
            .slice(0, 5)
            .map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-400">{step.action.description || step.action.type}</span>
                <span className="text-green-400 text-xs">✓ Success</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Multi-Agent Orchestration Dashboard
function MultiAgentDashboard({ trace, context }: { trace: ExecutionTrace; context: any }) {
  const agentTypes = ["Treasury", "Portfolio", "Payment"];
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-linear-to-r from-purple-500 to-pink-600 rounded-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">🤖 Multi-Agent Orchestration</h3>
          <p className="text-xs text-gray-500">Coordinated execution across 3 specialized agents</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {agentTypes.map((agent) => (
          <div key={agent} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-300">{agent} Agent</span>
            </div>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Execution Timeline</h4>
        <div className="space-y-3">
          {trace.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                step.status === "success" ? "bg-green-500" :
                step.status === "error" ? "bg-red-500" :
                "bg-gray-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  {step.action.description || `${step.action.type} action`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Step {index + 1} • {new Date(step.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                step.status === "success" ? "bg-green-500/20 text-green-400" :
                step.status === "error" ? "bg-red-500/20 text-red-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic Dashboard for unknown agent types
function GenericDashboard({ trace }: { trace: ExecutionTrace }) {
  const successSteps = trace.steps.filter((s) => s.status === "success").length;
  const totalSteps = trace.steps.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-gray-100">Workflow Execution</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Steps Completed"
          value={`${successSteps}/${totalSteps}`}
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          label="Success Rate"
          value={`${Math.round((successSteps / totalSteps) * 100)}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "green" | "blue" | "purple" | "yellow" | "gray";
}) {
  const colorClasses = {
    green: "bg-green-500/20 text-green-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    gray: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-100 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function AllocationBar({ label, target, current }: { label: string; target: number; current: number }) {
  const diff = current - target;
  const diffColor = Math.abs(diff) < 2 ? "text-green-400" : "text-yellow-400";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">
          {current}% <span className={`text-xs ${diffColor}`}>
            ({diff > 0 ? "+" : ""}{diff.toFixed(1)}% from target)
          </span>
        </span>
      </div>
      <div className="relative h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${current}%` }}
        />
        <div
          className="absolute h-full border-l-2 border-yellow-400"
          style={{ left: `${target}%` }}
        />
      </div>
    </div>
  );
}

function WalletBar({ label, amount, percentage }: { label: string; amount: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{amount} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
