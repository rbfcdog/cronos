# 🧠 LLM Agent Workflow - AI-Powered Decision Making

## 🎯 Overview

The **LLM Agent** node enables AI-powered decision making in your workflows. It uses a Large Language Model to analyze blockchain data, evaluate conditions, and make intelligent decisions about transaction execution.

## 🆕 What's New

Added a new `llm_agent` node type that brings AI intelligence to blockchain workflows:

- **🧠 Intelligent Analysis**: Uses GPT-4 or other LLMs to analyze data
- **💡 Dynamic Decisions**: Makes context-aware decisions based on multiple factors
- **🎯 Risk Assessment**: Evaluates safety and optimality before executing
- **📊 Parameter Generation**: Calculates optimal values dynamically
- **🔄 Multi-Factor Logic**: Combines data from multiple sources

## 📋 New Example Workflow

### Complex 4-Node AI-Powered Workflow:

```
┌─────────────────┐
│ 1. Check Balance│
│  (read_balance) │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│ 2. Read State  │  │                  │
│ (read_state)   │  │                  │
└────────┬───────┘  │                  │
         │          │                  │
         └──────────┴──────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ 3. LLM Risk Analysis │
         │    (llm_agent)       │
         │   🧠 AI Decision     │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────┐
         │ 4. Send Payment  │
         │  (x402_payment)  │
         └──────────────────┘
```

## 🎮 How It Works

### Step 1: Gather Data
The workflow collects blockchain state:
- **Node 1**: Reads wallet balance (10 TCRO)
- **Node 2**: Reads contract deployment state

### Step 2: AI Analysis
The LLM Agent analyzes the data with this prompt:

```
Analyze the wallet balance and contract state. 
Calculate the optimal payment amount considering:
1) Keep at least 30% as safety buffer
2) Gas costs (~0.01 TCRO)
3) Contract deployment status

Respond with JSON: {
  amount: number,
  shouldExecute: boolean,
  reason: string
}
```

### Step 3: Intelligent Decision
The AI considers multiple factors:
- ✅ Balance: 10 TCRO available
- ✅ Safety buffer: Keep 3 TCRO (30%)
- ✅ Gas estimate: ~0.01 TCRO
- ✅ Max safe amount: 10 - 3 - 0.01 = 6.99 TCRO
- ✅ Decision: Execute with 0.5 TCRO (well below limit)

### Step 4: Execute Payment
Based on AI approval, payment is executed safely.

## 🔧 LLM Agent Configuration

### Required Parameters:

**`prompt`** (string) - Instruction for the AI:
```
"Analyze the balance and decide if we should execute payment"
```

### Optional Parameters:

**`context`** (JSON) - Data for the AI to analyze:
```json
{
  "balance": "step_0.balance",
  "contractState": "step_1.state",
  "threshold": 5
}
```

**`model`** (string) - LLM to use:
- `gpt-4` (default) - Most capable
- `gpt-3.5-turbo` - Faster, cheaper
- `claude-3-opus` - Alternative provider

**`temperature`** (number, 0-1) - Creativity level:
- `0.0` - Deterministic, consistent
- `0.3` - Slightly varied (recommended for decisions)
- `0.7` - Creative (default)
- `1.0` - Very creative

**`maxTokens`** (number) - Response length limit:
- Default: `500`
- Range: `1-4000`

## 📤 LLM Agent Outputs

The agent provides structured outputs:

```json
{
  "decision": "execute",
  "reasoning": "Balance of 10 TCRO is above threshold. Safe to execute 0.5 TCRO payment with 30% buffer remaining.",
  "confidence": 0.95,
  "parameters": {
    "amount": 0.5,
    "shouldExecute": true,
    "gasBuffer": 0.01
  },
  "raw_response": "Based on analysis of the current balance..."
}
```

### Output Fields:

- **`decision`**: Primary recommendation ("execute", "skip", "wait")
- **`reasoning`**: Explanation of the decision
- **`confidence`**: Score from 0-1 indicating certainty
- **`parameters`**: Generated values for downstream nodes
- **`raw_response`**: Full LLM text response

## 🧪 Use Cases

### 1. **Risk Assessment**
```typescript
{
  prompt: "Is it safe to execute this transaction?",
  context: {
    balance: "step_0.balance",
    amount: 2,
    gasEstimate: "step_1.gasEstimate"
  },
  temperature: 0.2
}
```

### 2. **Dynamic Amount Calculation**
```typescript
{
  prompt: "Calculate optimal amount to send (max 50% of balance)",
  context: {
    balance: "step_0.balance",
    targetAddress: "step_1.address"
  },
  temperature: 0.3
}
```

### 3. **Multi-Factor Decision**
```typescript
{
  prompt: "Should we execute? Consider balance, gas, time, contract state.",
  context: {
    balance: "step_0.balance",
    gasEstimate: "step_1.gas",
    contractState: "step_2.state",
    hour: new Date().getHours()
  },
  temperature: 0.5
}
```

### 4. **Market Analysis**
```typescript
{
  prompt: "Analyze market conditions and recommend action",
  context: {
    price: "step_0.price",
    volume: "step_1.volume",
    liquidity: "step_2.liquidity"
  },
  temperature: 0.4
}
```

## 🎯 Best Practices

### ✅ DO:
- Use low temperature (0.2-0.3) for consistent decisions
- Provide clear, specific prompts
- Include all relevant context
- Ask for structured JSON responses
- Set safety buffers in prompts
- Test with simulation mode first

### ❌ DON'T:
- Use high temperature for financial decisions
- Provide vague instructions
- Skip important context
- Trust AI decisions blindly
- Execute without reviewing reasoning
- Use in production without testing

## 🔒 Security Considerations

1. **Review AI Decisions**: Always check the `reasoning` output
2. **Set Limits**: Include maximum amounts in prompts
3. **Test Thoroughly**: Use simulation mode extensively
4. **Monitor Confidence**: Low confidence (<0.7) = review manually
5. **Fallback Logic**: Have backup plans if AI fails
6. **Rate Limits**: Be aware of API rate limits

## 📊 Testing the LLM Workflow

### Load the Example:
1. Click **"Load Example"** button in header
2. You'll see the 4-node AI-powered workflow
3. Click **"Run Simulation"**

### What Happens:
1. ⏱️ **Step 0**: Reads balance (10 TCRO)
2. ⏱️ **Step 1**: Reads ExecutionRouter state
3. 🧠 **Step 2**: LLM analyzes data and makes decision
4. ⚡ **Step 3**: Executes payment based on AI approval

### Expected Output:

**Step 2 (LLM Agent)**:
```json
{
  "decision": "execute",
  "reasoning": "Current balance of 10 TCRO allows safe execution. After 30% buffer (3 TCRO) and gas (0.01 TCRO), can safely send up to 6.99 TCRO. Requested amount of 0.5 TCRO is well within limits.",
  "confidence": 0.95,
  "parameters": {
    "amount": 0.5,
    "shouldExecute": true,
    "remainingBalance": 9.5,
    "bufferMaintained": true
  }
}
```

**Step 3 (Payment)**:
```json
{
  "from": "0x...",
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "0.5",
  "token": "TCRO",
  "newBalance": "9.5"
}
```

## 🚀 Advanced Workflows

### Conditional Routing
Use AI decision to determine which path to take:
```
Balance → LLM → {execute path OR skip path}
```

### Iterative Optimization
Use AI to refine parameters over multiple steps:
```
Initial → LLM → Adjust → LLM → Final
```

### Risk Scoring
Chain multiple AI agents for complex analysis:
```
Data → Risk AI → Safety AI → Execute
```

## 🔮 Future Enhancements

Potential additions (not yet implemented):
- [ ] Multiple LLM providers (OpenAI, Anthropic, Cohere)
- [ ] Custom system prompts
- [ ] Function calling for structured outputs
- [ ] Streaming responses
- [ ] Context memory across workflow runs
- [ ] Fine-tuned models for blockchain analysis

## 📚 Technical Details

### Backend Integration (To Be Implemented):

The backend will need an LLM service:

```typescript
// backend/src/services/llm.service.ts
class LLMService {
  async analyze(prompt: string, context: any, model: string) {
    // Call OpenAI/Anthropic API
    // Parse response
    // Return structured decision
  }
}
```

### Simulation Mode:

For now, the LLM agent will return mock responses in simulation:

```json
{
  "decision": "execute",
  "reasoning": "[SIMULATED] AI would analyze: balance=10 TCRO, amount=0.5 TCRO. Decision: Safe to execute with adequate buffer.",
  "confidence": 0.9,
  "parameters": {
    "amount": 0.5,
    "shouldExecute": true
  }
}
```

## ✅ Summary

The LLM Agent brings AI-powered intelligence to blockchain workflows:

- ✅ **Intelligent Decisions**: Context-aware analysis
- ✅ **Risk Management**: Multi-factor safety evaluation
- ✅ **Dynamic Parameters**: Calculated optimal values
- ✅ **Explainable AI**: Clear reasoning for decisions
- ✅ **Flexible Configuration**: Customize model, temperature, prompts

**Try the new example workflow to see AI-powered blockchain automation in action!** 🧠🚀
