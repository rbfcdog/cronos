import { expect } from "chai";
import { ethers } from "hardhat";
import { ExecutionRouter, TreasuryVault, AttestationRegistry } from "../typechain-types";

describe("ExecutionRouter", () => {
  let executionRouter: ExecutionRouter;
  let treasuryVault: TreasuryVault;
  let attestationRegistry: AttestationRegistry;
  let owner: any;
  let executor: any;
  let user: any;

  beforeEach(async () => {
    [owner, executor, user] = await ethers.getSigners();

    // Deploy contracts
    const ExecutionRouter = await ethers.getContractFactory("ExecutionRouter");
    executionRouter = await ExecutionRouter.deploy();

    const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
    treasuryVault = await TreasuryVault.deploy();

    const AttestationRegistry = await ethers.getContractFactory("AttestationRegistry");
    attestationRegistry = await AttestationRegistry.deploy();

    // Setup permissions
    await executionRouter.authorizeExecutor(executor.address);
    await attestationRegistry.addTrustedAttester(executor.address);
  });

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await executionRouter.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as executor", async () => {
      expect(await executionRouter.authorizedExecutors(owner.address)).to.be.true;
    });
  });

  describe("Executor Authorization", () => {
    it("Should authorize new executor", async () => {
      await executionRouter.authorizeExecutor(user.address);
      expect(await executionRouter.authorizedExecutors(user.address)).to.be.true;
    });

    it("Should revoke executor", async () => {
      await executionRouter.revokeExecutor(executor.address);
      expect(await executionRouter.authorizedExecutors(executor.address)).to.be.false;
    });

    it("Should fail if non-owner tries to authorize", async () => {
      await expect(
        executionRouter.connect(user).authorizeExecutor(user.address)
      ).to.be.revertedWithCustomError(executionRouter, "OwnableUnauthorizedAccount");
    });
  });

  describe("Payment Execution", () => {
    const executionId = ethers.id("test-execution-1");
    const amount = ethers.parseEther("1.0");

    it("Should execute payment successfully", async () => {
      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      ).to.not.be.reverted;

      const execution = await executionRouter.executions(executionId);
      expect(execution.completed).to.be.true;
      expect(execution.success).to.be.true;
    });

    it("Should fail if not enough value sent", async () => {
      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: ethers.parseEther("0.5"),
          })
      ).to.be.revertedWith("Insufficient value");
    });

    it("Should fail if not authorized", async () => {
      await expect(
        executionRouter
          .connect(user)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail if already executed", async () => {
      await executionRouter
        .connect(executor)
        .executePayment(executionId, user.address, amount, "Test payment", {
          value: amount,
        });

      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      ).to.be.revertedWith("Already executed");
    });

    it("Should emit events", async () => {
      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      )
        .to.emit(executionRouter, "ExecutionRequested")
        .and.to.emit(executionRouter, "ExecutionCompleted");
    });
  });

  describe("Pause Functionality", () => {
    const executionId = ethers.id("test-execution-pause");
    const amount = ethers.parseEther("1.0");

    it("Should pause and unpause", async () => {
      await executionRouter.pause();
      
      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      ).to.be.revertedWithCustomError(executionRouter, "EnforcedPause");

      await executionRouter.unpause();
      
      await expect(
        executionRouter
          .connect(executor)
          .executePayment(executionId, user.address, amount, "Test payment", {
            value: amount,
          })
      ).to.not.be.reverted;
    });
  });

  describe("TreasuryVault", () => {
    it("Should accept deposits", async () => {
      const amount = ethers.parseEther("10");
      await expect(treasuryVault.deposit({ value: amount }))
        .to.emit(treasuryVault, "Deposited")
        .withArgs(owner.address, amount);
    });

    it("Should set allowances", async () => {
      const amount = ethers.parseEther("100");
      await treasuryVault.setAllowance(executor.address, amount);
      expect(await treasuryVault.allowances(executor.address)).to.equal(amount);
    });

    it("Should withdraw with allowance", async () => {
      const depositAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("50");

      await treasuryVault.deposit({ value: depositAmount });
      await treasuryVault.setAllowance(owner.address, withdrawAmount);
      
      await expect(
        treasuryVault.withdraw(user.address, withdrawAmount, "Test withdrawal")
      ).to.emit(treasuryVault, "Withdrawn");
    });
  });

  describe("AttestationRegistry", () => {
    it("Should record attestation", async () => {
      const executionId = ethers.id("test-attestation");
      const agentName = "planner-agent";
      const intentHash = "intent-hash-123";

      await expect(
        attestationRegistry
          .connect(executor)
          .attest(executionId, agentName, intentHash)
      )
        .to.emit(attestationRegistry, "AttestationRecorded")
        .withArgs(executionId, executor.address, agentName, await ethers.provider.getBlockNumber() + 1);

      const attestation = await attestationRegistry.getAttestation(executionId);
      expect(attestation.agentName).to.equal(agentName);
      expect(attestation.verified).to.be.true;
    });

    it("Should fail if not trusted attester", async () => {
      const executionId = ethers.id("test-attestation");
      
      await expect(
        attestationRegistry
          .connect(user)
          .attest(executionId, "agent", "hash")
      ).to.be.revertedWith("Not a trusted attester");
    });
  });
});
