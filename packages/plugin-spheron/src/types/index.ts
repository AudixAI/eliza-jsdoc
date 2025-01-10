import { Content } from "@elizaos/core";

/**
 * Interface for specifying configuration options for a Spheron compute instance.
 * @property { string } name - The name of the compute instance.
 * @property { string } image - The image to use for the compute instance.
 * @property { number } [replicas] - The number of replicas for the compute instance (optional).
 * @property { Array } [ports] - An array of objects specifying container and service ports for the compute instance.
 * @property { number } containerPort - The port number used in the container.
 * @property { number } servicePort - The port number used for the service.
 * @property { Array } [env] - An array of objects specifying environment variables for the compute instance.
 * @property { string } name - The name of the environment variable.
 * @property { string } value - The value of the environment variable.
 * @property { Object } [computeResources] - An object specifying compute resources for the compute instance.
 * @property { number } cpu - The CPU resources required for the compute instance.
 * @property { string } memory - The memory resources required for the compute instance.
 * @property { string } storage - The storage resources required for the compute instance.
 * @property { Object } [gpu] - An object specifying GPU resources for the compute instance.
 * @property { number } count - The number of GPUs required.
 * @property { string } model - The model of the GPU(s) required.
 * @property { string } [duration] - The duration of the compute instance (optional).
 * @property { string } [mode] - The mode of the compute instance (optional).
 * @property { string } [token] - The token required for authentication (optional).
 */
export interface SpheronComputeConfig {
    name: string;
    image: string;
    replicas?: number;
    ports?: Array<{
        containerPort: number;
        servicePort: number;
    }>;
    env?: Array<{
        name: string;
        value: string;
    }>;
    computeResources?: {
        cpu: number;
        memory: string;
        storage: string;
        gpu?: {
            count: number;
            model: string;
        };
    };
    duration?: string;
    mode?: string;
    token?: string;
}

/**
 * Interface representing the content of an escrow action.
 * Inherits properties from Content interface.
 * @property {string} token - The token related to the escrow action.
 * @property {number} amount - The amount of the escrow action.
 * @property {"deposit" | "withdraw" | "check"} operation - The type of operation for the escrow action.
 */
export interface EscrowContent extends Content {
    token: string;
    amount: number;
    operation: "deposit" | "withdraw" | "check";
}

/**
 * Represents the content for a deployment operation.
 * @interface DeploymentContent
 * @extends Content
 * @property {string} operation - The operation type ("create", "update", "close").
 * @property {string} [template] - The template for the deployment.
 * @property {Customizations} [customizations] - The customizations for the deployment.
 * @property {string} [leaseId] - The lease ID for the deployment.
 */
export interface DeploymentContent extends Content {
    operation: "create" | "update" | "close";
    template?: string;
    customizations?: Customizations;
    leaseId?: string;
}

/**
 * Interface representing customizations for a specific task.
 * @typedef {Object} Customizations
 * @property {boolean} cpu - Indicates if CPU is required.
 * @property {Object} resources - Object containing resource information.
 * @property {number} resources.cpu - Required CPU amount.
 * @property {string} resources.memory - Required memory amount.
 * @property {string} resources.storage - Required storage amount.
 * @property {number} resources.gpu - Required GPU amount.
 * @property {string} resources.gpu_model - Required GPU model.
 * @property {string} duration - Duration of the task.
 * @property {string} token - Token for authorization.
 * @property {Object} template - Optional template information.
 * @property {string} template.heuristMinerAddress - Address for Heurist Miner.
 */
export interface Customizations {
    cpu: boolean;
    resources: {
        cpu: number;
        memory: string;
        storage: string;
        gpu: number;
        gpu_model: string;
    };
    duration: string;
    token: string;
    template?: {
        heuristMinerAddress: string;
    };
}
/**
 * Interface representing information about a token.
 * @typedef {Object} TokenInfo
 * @property {string} name - The name of the token.
 * @property {string} symbol - The symbol of the token.
 * @property {number} decimal - The decimal precision of the token.
 */
export interface TokenInfo {
    name: string;
    symbol: string;
    decimal: number;
}

/**
 * Interface representing balance information.
 * @property {string} lockedBalance - The locked balance amount.
 * @property {string} unlockedBalance - The unlocked balance amount.
 * @property {TokenInfo} token - The token information associated with the balance.
 */
export interface BalanceInfo {
    lockedBalance: string;
    unlockedBalance: string;
    token: TokenInfo;
}

/**
 * Interface representing the details of a deployment.
 * @typedef {Object} DeploymentDetails
 * @property {Object.<string, {name: string, available: number, total: number, observed_generation: number, replicas: number, updated_replicas: number, ready_replicas: number, available_replicas: number, container_statuses: any[], creationTimestamp: string}>} services - Key-value pair with service information.
 * @property {Object.<string, Object[]>} forwarded_ports - Key-value pair with forwarded port information.
 * @property {null|Object} ips - Nullable object representing IPs.
 */
export interface DeploymentDetails {
    services: {
        [key: string]: {
            name: string;
            available: number;
            total: number;
            observed_generation: number;
            replicas: number;
            updated_replicas: number;
            ready_replicas: number;
            available_replicas: number;
            container_statuses: any[];
            creationTimestamp: string;
        };
    };
    forwarded_ports: {
        [key: string]: Array<{
            host: string;
            port: number;
            externalPort: number;
            proto: string;
            name: string;
        }>;
    };
    ips: null | object;
}