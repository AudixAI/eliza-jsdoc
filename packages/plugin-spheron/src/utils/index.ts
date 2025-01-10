import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { SpheronSDK } from "@spheron/protocol-sdk";
import { validateSpheronConfig } from "../environment.ts";
import {
    BalanceInfo,
    DeploymentDetails,
    SpheronComputeConfig,
} from "../types/index.ts";

export const getSDKInstance = async (
    runtime: IAgentRuntime
): Promise<SpheronSDK> => {
    const config = await validateSpheronConfig(runtime);
    return new SpheronSDK("testnet", config.PRIVATE_KEY);
};

// Escrow Operations
export const getUserBalance = async (
    runtime: IAgentRuntime,
    token: string,
    walletAddress?: string
): Promise<BalanceInfo> => {
    const sdk = await getSDKInstance(runtime);
    return await sdk.escrow.getUserBalance(token, walletAddress);
};

/**
 * Deposits a specified amount of a token into the user's escrow balance.
 * 
 * @param {IAgentRuntime} runtime - The runtime of the agent.
 * @param {string} token - The token to deposit.
 * @param {number} amount - The amount to deposit.
 * @returns {Promise<any>} Promise that resolves with the deposit result.
 */
export const depositBalance = async (
    runtime: IAgentRuntime,
    token: string,
    amount: number
): Promise<any> => {
    const sdk = await getSDKInstance(runtime);
    return await sdk.escrow.depositBalance({
        token,
        amount,
        onFailureCallback: (error) => {
            elizaLogger.error("Deposit failed: ", error);
            throw error;
        },
    });
};

/**
 * Performs a withdrawal of a specified balance from a user's escrow account.
 * 
 * @param {IAgentRuntime} runtime - The runtime instance of the agent.
 * @param {string} token - The token symbol to withdraw balance in.
 * @param {number} amount - The amount of balance to withdraw.
 * @returns {Promise<any>} - A promise that resolves with the result of the withdrawal.
 */
export const withdrawBalance = async (
    runtime: IAgentRuntime,
    token: string,
    amount: number
): Promise<any> => {
    const sdk = await getSDKInstance(runtime);
    return await sdk.escrow.withdrawBalance({
        token,
        amount,
        onFailureCallback: (error) => {
            elizaLogger.error("Withdrawal failed:", error);
            throw error;
        },
    });
};

// Deployment Operations
/**
 * Starts deployment process by checking balance, creating deployment order, and waiting for deployment to be ready.
 * @param {IAgentRuntime} runtime - The agent runtime object
 * @param {SpheronComputeConfig} computeConfig - The compute configuration object for deployment
 * @returns {Promise<any>} - A promise that resolves with the deployment result
 */
export const startDeployment = async (
    runtime: IAgentRuntime,
    computeConfig: SpheronComputeConfig
): Promise<any> => {
    // Check balance before deployment
    const token = computeConfig.token || "CST";
    const balance = await getUserBalance(runtime, token);

    // Ensure unlockedBalance and decimals exist and are valid
    if (!balance.unlockedBalance || !balance.token?.decimal) {
        throw new Error("Invalid balance info structure");
    }

    const unlockedBalance = BigInt(balance.unlockedBalance);
    const decimal = BigInt(balance.token.decimal);
    const divisor = BigInt(10) ** decimal;

    // Calculate withdrawal amount and convert to string with proper decimal places
    const balanceAmount = Number(unlockedBalance) / Number(divisor);

    const requiredAmount =
        calculateGPUPrice(computeConfig.computeResources?.gpu) *
        (computeConfig.duration ? parseDuration(computeConfig.duration) : 1);

    if (balanceAmount < requiredAmount) {
        throw new Error(
            `Insufficient balance. Available: ${balanceAmount} ${token}, Required: ${requiredAmount} ${token}`
        );
    }

    const result = await createOrder(runtime, generateICLYaml(computeConfig));
    // Wait for new deployment to be ready
    let isReady = false;
    const maxAttempts = 10; // 10 times with 10-second intervals
    let attempts = 0;

    while (!isReady && attempts < maxAttempts) {
        const status = await getDeploymentStatus(
            runtime,
            result.leaseId.toString()
        );
        elizaLogger.debug(
            `Deployment status (attempt ${attempts + 1}/${maxAttempts}):`,
            status
        );

        if (status) {
            isReady = true;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            attempts++;
        }
    }

    if (isReady) {
        elizaLogger.log("Deployment ready");
    } else {
        elizaLogger.error(`Deployment not ready after ${maxAttempts} attempts`);
        throw new Error("Deployment timeout");
    }
    return result;
};

/**
 * Updates a deployment with the specified runtime, lease ID, and compute configuration.
 *
 * @param {IAgentRuntime} runtime - The runtime object containing necessary runtime information.
 * @param {string} leaseId - The ID of the lease associated with the deployment.
 * @param {SpheronComputeConfig} computeConfig - The compute configuration for the deployment.
 * @returns {Promise<any>} A promise that resolves with the result of the deployment update.
 */
export const updateDeployment = async (
    runtime: IAgentRuntime,
    leaseId: string,
    computeConfig: SpheronComputeConfig
): Promise<any> => {
    // Check balance before deployment update
    const token = computeConfig.token || "CST";
    const balance = await getUserBalance(runtime, token);

    // Ensure unlockedBalance and decimals exist and are valid
    if (!balance.unlockedBalance || !balance.token?.decimal) {
        throw new Error("Invalid balance info structure");
    }

    const unlockedBalance = BigInt(balance.unlockedBalance);
    const decimal = BigInt(balance.token.decimal);
    const divisor = BigInt(10) ** decimal;

    // Calculate withdrawal amount and convert to string with proper decimal places
    const balanceAmount = Number(unlockedBalance) / Number(divisor);

    const requiredAmount =
        calculateGPUPrice(computeConfig.computeResources?.gpu) *
        (computeConfig.duration ? parseDuration(computeConfig.duration) : 1);

    if (balanceAmount < requiredAmount) {
        throw new Error(
            `Insufficient balance. Available: ${balanceAmount} ${token}, Required: ${requiredAmount} ${token}`
        );
    }

    const result = await updateOrder(
        runtime,
        leaseId.toString(),
        generateICLYaml(computeConfig)
    );

    // Wait for new deployment to be ready
    let isReady = false;
    const maxAttempts = 10; // 10 times with 10-second intervals
    let attempts = 0;

    while (!isReady && attempts < maxAttempts) {
        const status = await getDeploymentStatus(runtime, leaseId.toString());
        elizaLogger.debug(
            `Deployment status (attempt ${attempts + 1}/${maxAttempts}):`,
            status
        );

        if (status) {
            isReady = true;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            attempts++;
        }
    }

    if (isReady) {
        elizaLogger.log("Deployment ready");
    } else {
        elizaLogger.error(`Deployment not ready after ${maxAttempts} attempts`);
        throw new Error("Deployment timeout");
    }
    return result;
};

/**
 * Function to create an order using the given iclYaml string.
 * 
 * @param {IAgentRuntime} runtime - The runtime object containing necessary information.
 * @param {string} iclYaml - The iclYaml string used to create the order.
 * @returns {Promise<{ leaseId: string; transaction: any }>} - A Promise that resolves to an object with leaseId and transaction values.
 */
export const createOrder = async (
    runtime: IAgentRuntime,
    iclYaml: string
): Promise<{ leaseId: string; transaction: any }> => {
    elizaLogger.debug("Creating order with iclYaml:", iclYaml);
    const sdk = await getSDKInstance(runtime);
    const config = await validateSpheronConfig(runtime);
    return await sdk.deployment.createDeployment(
        iclYaml,
        config.PROVIDER_PROXY_URL
    );
};

/**
 * Updates an order by calling the updateDeployment method of the SDK instance.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime instance.
 * @param {string} leaseId - The ID of the lease to update.
 * @param {string} iclYaml - The ICL YAML string for the update.
 * @returns {Promise<{ providerAddress: string }>} Result object with the provider address.
 */
export const updateOrder = async (
    runtime: IAgentRuntime,
    leaseId: string,
    iclYaml: string
): Promise<{ providerAddress: string }> => {
    const sdk = await getSDKInstance(runtime);
    const config = await validateSpheronConfig(runtime);
    return await sdk.deployment.updateDeployment(
        leaseId,
        iclYaml,
        config.PROVIDER_PROXY_URL
    );
};

/**
 * Retrieves details of a specific deployment using the lease ID.
 * 
 * @param {IAgentRuntime} runtime The runtime context of the agent.
 * @param {string} leaseId The unique identifier of the deployment.
 * @return {Promise<DeploymentDetails>} The details of the deployment.
 */
export const getDeployment = async (
    runtime: IAgentRuntime,
    leaseId: string
): Promise<DeploymentDetails> => {
    elizaLogger.debug("Getting deployment with lease ID:", leaseId);
    const sdk = await getSDKInstance(runtime);
    const config = await validateSpheronConfig(runtime);
    return await sdk.deployment.getDeployment(
        leaseId,
        config.PROVIDER_PROXY_URL
    );
};

export const closeDeployment = async (
    runtime: IAgentRuntime,
    leaseId: string
): Promise<any> => {
    const sdk = await getSDKInstance(runtime);
    return await sdk.deployment.closeDeployment(leaseId);
};

/**
 * Retrieves the deployment status for a specific deployment ID.
 * 
 * @param {IAgentRuntime} runtime The agent runtime to use for retrieving the deployment status.
 * @param {string} deploymentId The ID of the deployment to retrieve the status for.
 * @returns {Promise<boolean>} A boolean indicating if the deployment is ready or not.
 * @throws {Error} If there was an error retrieving the deployment status.
 */ 

export async function getDeploymentStatus(
    runtime: IAgentRuntime,
    deploymentId: string
): Promise<boolean> {
    try {
        const deployment = await getDeployment(runtime, deploymentId);
        const service = Object.values(deployment.services)[0];
        return service.ready_replicas === service.total;
    } catch (error: any) {
        throw new Error(`Failed to get deployment status: ${error.message}`);
    }
}

/**
 * Calculate the total price for a GPU based on its model and count.
 * 
 * @param {Object} gpu - The GPU object containing model and count.
 * @param {string} gpu.model - The model of the GPU.
 * @param {number} gpu.count - The quantity of GPUs.
 * 
 * @returns {number} Total price for the GPU(s).
 */
function calculateGPUPrice(gpu?: { model?: string; count?: number }): number {
    if (!gpu) return 1;

    const basePrice = (() => {
        switch (gpu.model?.toLowerCase()) {
            // Consumer GPUs
            case "rtx4090":
                return 0.7;
            case "rtx3090":
                return 0.5;
            case "rtx3080":
                return 0.4;
            case "rtx3070":
                return 0.3;
            // Data Center GPUs
            case "h100":
                return 3.0;
            case "a100":
                return 1.5;
            case "a40":
                return 1.2;
            case "a30":
                return 1.2;
            case "a16":
                return 1.0;
            // Default case
            default:
                return 0.5;
        }
    })();

    return basePrice * (gpu.count || 1);
}

/**
 * Generates an ICL YAML configuration based on the provided SpheronComputeConfig
 * 
 * @param {SpheronComputeConfig} config - The SpheronComputeConfig object containing the configuration details
 * @returns {string} The resulting ICL YAML configuration string
 */
export function generateICLYaml(config: SpheronComputeConfig): string {
    return `version: "1.0"
services:
  ${config.name}:
    image: ${config.image}
    ${
        config.ports
            ? `expose:
      ${config.ports
          .map(
              (p) => `- port: ${p.containerPort}
        as: ${p.servicePort}
        to:
          - global: true`
          )
          .join("\n      ")}`
            : ""
    }
    ${
        config.env
            ? `env:
      ${config.env.map((e) => `- ${e.name}=${e.value}`).join("\n      ")}`
            : ""
    }
profiles:
  name: ${config.name}
  duration: ${config.duration || "24h"}
  mode: ${config.mode || "provider"}
  tier:
    - community
  compute:
    ${config.name}:
      resources:
        cpu:
          units: ${config.computeResources?.cpu || 2}
        memory:
          size: ${config.computeResources?.memory || "2Gi"}
        storage:
          - size: ${config.computeResources?.storage || "10Gi"}
        ${
            config.computeResources?.gpu
                ? `gpu:
          units: ${config.computeResources?.gpu?.count || 1}
          attributes:
            vendor:
              nvidia:
                - model: ${config.computeResources?.gpu?.model || "rtx4090"}`
                : ""
        }
  placement:
    westcoast:
      pricing:
        ${config.name}:
          token: ${config.token || "CST"}
          amount: ${calculateGPUPrice(config.computeResources?.gpu)}
deployment:
  ${config.name}:
    westcoast:
      profile: ${config.name}
      count: ${config.replicas || 1}`;
}

/**
 * Parses the given duration string and converts it to a number value in hours.
 * 
 * @param {string} duration The duration string to parse (format: number followed by h(hours), d(days), w(weeks), or m(months))
 * @returns {number} The parsed duration value in hours
 * @throws {Error} If the duration string is in an invalid format
 */
function parseDuration(duration: string): number {
    const match = duration.match(/^(\d*\.?\d+)(h|d|w|m)$/);
    if (!match) {
        throw new Error(
            "Invalid duration format. Expected format: number (can include decimals) followed by h(hours), d(days), w(weeks), or m(months)"
        );
    }

    const [, value, unit] = match;
    const numValue = parseFloat(value);

    switch (unit) {
        case "min":
            return numValue / 60;
        case "h":
            return numValue;
        case "d":
            return numValue * 24;
        case "w":
            return numValue * 7 * 24;
        case "m":
            return numValue * 30 * 24;
        default:
            return 1;
    }
}
