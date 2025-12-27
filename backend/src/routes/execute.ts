import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import cronosService from "../services/cronos.service";
import config from "../config";

const router = Router();

/**
 * Execute a simple payment
 * POST /execute/payment
 */
router.post("/payment", async (req: Request, res: Response) => {
  try {
    const { recipient, amount, reason, executionId } = req.body;

    // Validation
    if (!recipient || !amount) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["recipient", "amount"],
      });
    }

    if (!ethers.isAddress(recipient)) {
      return res.status(400).json({
        error: "Invalid recipient address",
      });
    }

    const finalExecutionId = executionId || `payment-${Date.now()}`;
    const finalReason = reason || "Agent-triggered payment";

    console.log(`\n💸 Processing payment execution:`);
    console.log(`   Execution ID: ${finalExecutionId}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Amount: ${amount} CRO`);
    console.log(`   Reason: ${finalReason}`);

    let result;

    // Use ExecutionRouter if configured, otherwise direct transfer
    if (config.contracts.executionRouter) {
      console.log(`   Method: Via ExecutionRouter`);
      result = await cronosService.executePaymentViaRouter(
        finalExecutionId,
        recipient,
        amount,
        finalReason
      );
    } else {
      console.log(`   Method: Direct transfer`);
      const txHash = await cronosService.sendPayment(recipient, amount);
      result = { hash: txHash, success: true };
    }

    console.log(`   ✅ Transaction Hash: ${result.hash}\n`);

    res.json({
      success: true,
      executionId: finalExecutionId,
      transactionHash: result.hash,
      recipient,
      amount,
      explorerUrl: `${config.cronos.testnet.explorer}/tx/${result.hash}`,
    });
  } catch (error: any) {
    console.error("❌ Payment execution failed:", error.message);
    res.status(500).json({
      error: "Payment execution failed",
      message: error.message,
    });
  }
});

/**
 * Execute a contract interaction
 * POST /execute/contract
 */
router.post("/contract", async (req: Request, res: Response) => {
  try {
    const { targetContract, callData, value, intentType, executionId } = req.body;

    // Validation
    if (!targetContract || !callData) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["targetContract", "callData"],
      });
    }

    if (!ethers.isAddress(targetContract)) {
      return res.status(400).json({
        error: "Invalid target contract address",
      });
    }

    if (!config.contracts.executionRouter) {
      return res.status(503).json({
        error: "ExecutionRouter not configured",
        message: "Please deploy contracts and configure EXECUTION_ROUTER_ADDRESS",
      });
    }

    const finalExecutionId = executionId || `contract-${Date.now()}`;
    const finalIntentType = intentType || "contract-interaction";
    const finalValue = value || "0";

    console.log(`\n⚙️  Processing contract execution:`);
    console.log(`   Execution ID: ${finalExecutionId}`);
    console.log(`   Target: ${targetContract}`);
    console.log(`   Intent Type: ${finalIntentType}`);
    console.log(`   Value: ${finalValue} CRO`);

    const result = await cronosService.executeViaRouter(
      finalExecutionId,
      finalIntentType,
      targetContract,
      callData,
      finalValue
    );

    console.log(`   ✅ Transaction Hash: ${result.hash}\n`);

    res.json({
      success: result.success,
      executionId: finalExecutionId,
      transactionHash: result.hash,
      targetContract,
      explorerUrl: `${config.cronos.testnet.explorer}/tx/${result.hash}`,
    });
  } catch (error: any) {
    console.error("❌ Contract execution failed:", error.message);
    res.status(500).json({
      error: "Contract execution failed",
      message: error.message,
    });
  }
});

/**
 * Record an attestation
 * POST /execute/attest
 */
router.post("/attest", async (req: Request, res: Response) => {
  try {
    const { executionId, agentName, intentHash } = req.body;

    if (!executionId || !agentName || !intentHash) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["executionId", "agentName", "intentHash"],
      });
    }

    if (!config.contracts.attestationRegistry) {
      return res.status(503).json({
        error: "AttestationRegistry not configured",
      });
    }

    console.log(`\n📋 Recording attestation:`);
    console.log(`   Execution ID: ${executionId}`);
    console.log(`   Agent: ${agentName}`);
    console.log(`   Intent Hash: ${intentHash}`);

    const txHash = await cronosService.recordAttestation(
      executionId,
      agentName,
      intentHash
    );

    console.log(`   ✅ Transaction Hash: ${txHash}\n`);

    res.json({
      success: true,
      executionId,
      transactionHash: txHash,
      explorerUrl: `${config.cronos.testnet.explorer}/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error("❌ Attestation failed:", error.message);
    res.status(500).json({
      error: "Attestation failed",
      message: error.message,
    });
  }
});

export default router;
