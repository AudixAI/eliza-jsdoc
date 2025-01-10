import { ButtplugClient, ButtplugNodeWebsocketClientConnector } from "buttplug";
import { validateIntifaceConfig, type IntifaceConfig } from "./environment";
import type {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@elizaos/core";
import { Service, ServiceType } from "@elizaos/core";
import {
    isPortAvailable,
    startIntifaceEngine,
    shutdownIntifaceEngine,
} from "./utils";

/**
 * Interface for defining the methods that an Intiface service class should implement.
 * @interface
 * @extends { Service }
 */
export interface IIntifaceService extends Service {
    vibrate(strength: number, duration: number): Promise<void>;
    rotate?(strength: number, duration: number): Promise<void>;
    getBatteryLevel?(): Promise<number>;
    isConnected(): boolean;
    getDevices(): any[];
}

/**
 * Represents the Intiface service that extends a Service and implements the IIntifaceService interface.
 * @property {ServiceType} serviceType - The type of service, set to ServiceType.INTIFACE.
 * @property {ButtplugClient} client - The ButtplugClient used for communication.
 * @property {boolean} connected - A flag indicating if the service is connected.
 * @property {Map<string, any>} devices - A mapping of device names to their corresponding data.
 * @property {VibrateEvent[]} vibrateQueue - An array of VibrateEvent objects representing the vibrate queue.
 * @property {boolean} isProcessingQueue - A flag indicating if the vibrate queue is being processed.
 * @property {IntifaceConfig | null} config - The configuration settings for the Intiface service, or null if none provided.
 * @property {number} maxVibrationIntensity - The maximum vibration intensity value.
 */
export class IntifaceService extends Service implements IIntifaceService {
    static serviceType: ServiceType = ServiceType.INTIFACE;
    private client: ButtplugClient;
    private connected = false;
    private devices: Map<string, any> = new Map();
    private vibrateQueue: VibrateEvent[] = [];
    private isProcessingQueue = false;
    private config: IntifaceConfig | null = null;
    private maxVibrationIntensity = 1;
    private rampUpAndDown = false;
    private rampSteps = 20;
    private preferredDeviceName: string | undefined;

/**
 * Constructor for initializing the ButtplugClient object.
 * Initializes the ButtplugClient with a temporary name.
 * Sets up event listeners for when devices are added or removed.
 * Adds cleanup handlers for SIGINT, SIGTERM, and exit events.
 */
    constructor() {
        super();
        this.client = new ButtplugClient("Temporary Name");

        this.client.addListener(
            "deviceadded",
            this.handleDeviceAdded.bind(this)
        );
        this.client.addListener(
            "deviceremoved",
            this.handleDeviceRemoved.bind(this)
        );

        // Add cleanup handlers
        process.on("SIGINT", this.cleanup.bind(this));
        process.on("SIGTERM", this.cleanup.bind(this));
        process.on("exit", this.cleanup.bind(this));
    }

/**
 * Asynchronously cleans up resources used by the IntifaceService.
 * If the client is connected, disconnects the client. 
 * Then shuts down the IntifaceEngine.
 * Logs any errors that occur during cleanup.
 */

    private async cleanup() {
        try {
            if (this.connected) {
                await this.client.disconnect();
            }
            await shutdownIntifaceEngine();
        } catch (error) {
            console.error("[IntifaceService] Cleanup error:", error);
        }
    }

/**
 * Returns an instance of the IntifaceService.
 * @returns {IIntifaceService} The instance of the IntifaceService.
 */
    getInstance(): IIntifaceService {
        return this;
    }

/**
 * Asynchronously initializes the Intiface Agent by setting up the configuration,
 * the preferred device name, and creating a new Buttplug client.
 * If the Intiface URL is provided in the configuration, it then connects to the
 * Intiface server.
 * @param {IAgentRuntime} runtime - The runtime environment for the Intiface Agent.
 * @returns {Promise<void>}
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.config = await validateIntifaceConfig(runtime);
        this.preferredDeviceName = this.config.DEVICE_NAME;
        this.client = new ButtplugClient(this.config.INTIFACE_NAME);

        if (this.config.INTIFACE_URL) {
            await this.connect();
        }
    }

/**
 * Establishes a connection to the Intiface server using the provided configuration.
 * If the connection is already established or no configuration is provided, the method returns early.
 * 
 * The method first checks if port 12345 is available by calling isPortAvailable.
 * If the port is available, it attempts to start the Intiface Engine by calling startIntifaceEngine.
 * If starting the Intiface Engine fails, an error is logged and propagated.
 * 
 * Next, the method attempts to connect to the Intiface server using the ButtplugNodeWebsocketClientConnector.
 * If the connection is successful, the client is marked as connected, devices are scanned and grabbed, and the method returns.
 * 
 * If the connection attempt fails, the method retries up to 5 times with a 2-second delay between attempts.
 * If all retry attempts fail, an error is logged and propagated.
 */
    async connect() {
        if (this.connected || !this.config) return;

        const portAvailable = await isPortAvailable(12345);

        if (portAvailable) {
            try {
                await startIntifaceEngine();
            } catch (error) {
                console.error("Failed to start Intiface Engine:", error);
                throw error;
            }
        } else {
            console.log(
                "Port 12345 is in use, assuming Intiface is already running"
            );
        }

        let retries = 5;
        while (retries > 0) {
            try {
                const connector = new ButtplugNodeWebsocketClientConnector(
                    this.config.INTIFACE_URL
                );

                await this.client.connect(connector);
                this.connected = true;
                await this.scanAndGrabDevices();
                return;
            } catch (error) {
                retries--;
                if (retries > 0) {
                    console.log(
                        `Connection attempt failed, retrying... (${retries} attempts left)`
                    );
                    await new Promise((r) => setTimeout(r, 2000));
                } else {
                    console.error(
                        "Failed to connect to Intiface server after all retries:",
                        error
                    );
                    throw error;
                }
            }
        }
    }

/**
 * Asynchronously scans for devices using the client's startScanning method,
 * grabs all found devices and stores them in a map. 
 * If no devices are found, it logs a message indicating so. 
 */
    private async scanAndGrabDevices() {
        await this.client.startScanning();
        console.log("Scanning for devices...");
        await new Promise((r) => setTimeout(r, 2000));

        this.client.devices.forEach((device) => {
            this.devices.set(device.name, device);
            console.log(`- ${device.name} (${device.index})`);
        });

        if (this.devices.size === 0) {
            console.log("No devices found");
        }
    }

/**
 * Ensures that a device is available for communication.
 * 
 * @throws {Error} When not connected to Intiface server
 * @throws {Error} When no devices are available
 * 
 * @returns {Promise<Object>} The available device for communication
 */
    private async ensureDeviceAvailable() {
        if (!this.connected) {
            throw new Error("Not connected to Intiface server");
        }

        if (this.devices.size === 0) {
            await this.scanAndGrabDevices();
        }

        const devices = this.getDevices();
        if (devices.length === 0) {
            throw new Error("No devices available");
        }

        let targetDevice;
        if (this.preferredDeviceName) {
            targetDevice = this.devices.get(this.preferredDeviceName);
            if (!targetDevice) {
                console.warn(
                    `Preferred device ${this.preferredDeviceName} not found, using first available device`
                );
                targetDevice = devices[0];
            }
        } else {
            targetDevice = devices[0];
        }

        return targetDevice;
    }

/**
 * Disconnects the client from the server. Clears all devices from the client and sets 'connected' status to false.
 */
    async disconnect() {
        if (!this.connected) return;
        await this.client.disconnect();
        this.connected = false;
        this.devices.clear();
    }

/**
 * Handles the event when a device is added.
 * 
 * @param {any} device - The device that was added.
 */
    private handleDeviceAdded(device: any) {
        this.devices.set(device.name, device);
        console.log(`Device connected: ${device.name}`);
    }

/**
 * Handles the event when a device is removed.
 * 
 * @param {any} device - The device that was removed.
 */
    private handleDeviceRemoved(device: any) {
        this.devices.delete(device.name);
        console.log(`Device disconnected: ${device.name}`);
    }

/**
 * Retrieve all devices from the collection.
 * 
 * @returns {Array.<any>} An array containing all devices in the collection.
 */
    getDevices() {
        return Array.from(this.devices.values());
    }

/**
 * Checks if the object is currently connected.
 * @returns {boolean} True if the object is connected, false otherwise.
 */
    isConnected() {
        return this.connected;
    }

/**
 * Adds a VibrateEvent to the vibrate queue and starts processing the queue if it is not already being processed.
 * @param {VibrateEvent} event - The VibrateEvent to add to the queue.
 */
    private async addToVibrateQueue(event: VibrateEvent) {
        this.vibrateQueue.push(event);
        if (!this.isProcessingQueue) {
            this.isProcessingQueue = true;
            await this.processVibrateQueue();
        }
    }

/**
 * Process each item in the vibrate queue and handle the vibration event asynchronously.
 * This method will continue to process the queue until it is empty.
 */
    private async processVibrateQueue() {
        while (this.vibrateQueue.length > 0) {
            const event = this.vibrateQueue[0];
            await this.handleVibrate(event);
            this.vibrateQueue.shift();
        }
        this.isProcessingQueue = false;
    }

/**
 * Handles the vibration event by generating a ramp-up and ramp-down effect if specified.
 * @param {VibrateEvent} event - The vibration event containing duration and strength information.
 * @returns {Promise<void>} A Promise that resolves once the vibration handling is complete.
 */
    private async handleVibrate(event: VibrateEvent) {
        const targetDevice = await this.ensureDeviceAvailable();

        if (this.rampUpAndDown) {
            const steps = this.rampSteps;
            const rampLength = (event.duration * 0.2) / steps;
            let startIntensity = 0;
            let endIntensity = event.strength;
            let stepIntensity = (endIntensity - startIntensity) / steps;

            // Ramp up
            for (let i = 0; i <= steps; i++) {
                await targetDevice.vibrate(startIntensity + stepIntensity * i);
                await new Promise((r) => setTimeout(r, rampLength));
            }

            // Hold
            await new Promise((r) => setTimeout(r, event.duration * 0.54));

            // Ramp down
            startIntensity = event.strength;
            endIntensity = 0;
            stepIntensity = (endIntensity - startIntensity) / steps;

            for (let i = 0; i <= steps; i++) {
                await targetDevice.vibrate(startIntensity + stepIntensity * i);
                await new Promise((r) => setTimeout(r, rampLength));
            }
        } else {
            await targetDevice.vibrate(event.strength);
            await new Promise((r) => setTimeout(r, event.duration));
        }

        await targetDevice.stop();
    }

/**
 * Vibrates the target device with the specified strength and duration.
 * 
 * @param {number} strength - The strength of the vibration.
 * @param {number} duration - The duration of the vibration.
 * @returns {Promise<void>} A Promise that resolves when the vibration is successfully added to the queue.
 */
    async vibrate(strength: number, duration: number): Promise<void> {
        const targetDevice = await this.ensureDeviceAvailable();
        await this.addToVibrateQueue({
            strength,
            duration,
            deviceId: targetDevice.id,
        });
    }

/**
 * Asynchronously retrieves the battery level of the target device.
 * 
 * @returns {Promise<number>} A Promise that resolves with the battery level (as a percentage).
 * @throws {Error} If there is an error retrieving the battery level.
 */
    async getBatteryLevel(): Promise<number> {
        const targetDevice = await this.ensureDeviceAvailable();

        try {
            const battery = await targetDevice.battery();
            console.log(
                `Battery level for ${targetDevice.name}: ${battery * 100}%`
            );
            return battery;
        } catch (err) {
            console.error("Error getting battery level:", err);
            throw err;
        }
    }

/**
 * Rotates the device with the specified strength and duration.
 * 
 * @param {number} strength - The strength of the rotation.
 * @param {number} duration - The duration of the rotation.
 * @returns {Promise<void>} A Promise that resolves when the rotation is completed.
 * @throws {Error} If the device does not support rotation.
 */
    async rotate(strength: number, duration: number): Promise<void> {
        const targetDevice = await this.ensureDeviceAvailable();

        // Check if device supports rotation
        if (!targetDevice.rotateCmd) {
            throw new Error("Device does not support rotation");
        }

        if (this.rampUpAndDown) {
            await this.rampedRotate(targetDevice, strength, duration);
        } else {
            await targetDevice.rotate(strength);
            await new Promise((r) => setTimeout(r, duration));
            await targetDevice.stop();
        }
    }

/**
 * Ramps up the rotation intensity of a device to a target strength over a specified duration,
 * holds at the target strength for a duration, and then ramps down the rotation intensity back to zero.
 * @param {any} device - The device to rotate.
 * @param {number} targetStrength - The target strength of rotation.
 * @param {number} duration - The total duration for the ramp up, hold, and ramp down phases.
 * @returns {Promise<void>}
 */
    private async rampedRotate(
        device: any,
        targetStrength: number,
        duration: number
    ) {
        const stepTime = (duration * 0.2) / this.rampSteps;

        // Ramp up
        for (let i = 0; i <= this.rampSteps; i++) {
            const intensity = (targetStrength / this.rampSteps) * i;
            await device.rotate(intensity);
            await new Promise((r) => setTimeout(r, stepTime));
        }

        // Hold
        await new Promise((r) => setTimeout(r, duration * 0.6));

        // Ramp down
        for (let i = this.rampSteps; i >= 0; i--) {
            const intensity = (targetStrength / this.rampSteps) * i;
            await device.rotate(intensity);
            await new Promise((r) => setTimeout(r, stepTime));
        }

        await device.stop();
    }
}

/**
 * Action for controlling vibration intensity of connected devices.
 * @typedef {Object} VibrateAction
 * @property {string} name - The name of the action ("VIBRATE").
 * @property {string[]} similes - List of similes related to vibration.
 * @property {string} description - Description of the action.
 * @property {Function} validate - Async function to validate Intiface configuration.
 * @property {Function} handler - Async function to handle the vibration action.
 * @property {Object[]} examples - Array of examples demonstrating the usage of the action.
 */
const vibrateAction: Action = {
    name: "VIBRATE",
    similes: ["VIBRATE_TOY", "VIBRATE_DEVICE", "START_VIBRATION", "BUZZ"],
    description: "Control vibration intensity of connected devices",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        try {
            await validateIntifaceConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const service = runtime.getService<IIntifaceService>(
            ServiceType.INTIFACE
        );
        if (!service) {
            throw new Error("Intiface service not available");
        }

        // Extract intensity and duration from message
        // Default to 50% intensity for 2 seconds if not specified
        const intensity = options?.intensity ?? 0.5;
        const duration = options?.duration ?? 2000;

        await service.vibrate(intensity, duration);

        callback({
            text: `Vibrating at ${intensity * 100}% intensity for ${duration}ms`,
        });
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Vibrate the toy at 70% for 3 seconds" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Vibrating at 70% intensity for 3000ms",
                    action: "VIBRATE",
                    options: { intensity: 0.7, duration: 3000 },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Start vibrating" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Vibrating at 50% intensity for 2000ms",
                    action: "VIBRATE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Make it buzz at max power for 5 seconds" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Vibrating at 100% intensity for 5000ms",
                    action: "VIBRATE",
                    options: { intensity: 1.0, duration: 5000 },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Give me a gentle buzz" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Vibrating at 25% intensity for 2000ms",
                    action: "VIBRATE",
                    options: { intensity: 0.25, duration: 2000 },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Vibrate for 10 seconds" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Vibrating at 50% intensity for 10000ms",
                    action: "VIBRATE",
                    options: { intensity: 0.5, duration: 10000 },
                },
            },
        ],
    ],
};

/**
 * Action for controlling rotation intensity of connected devices.
 * @typedef {Object} rotateAction
 * @property {string} name - The name of the action ("ROTATE").
 * @property {string[]} similes - Array of similes associated with the action.
 * @property {string} description - Description of the action.
 * @property {Function} validate - Asynchronous function to validate the action.
 * @param {IAgentRuntime} runtime - The agent runtime interface.
 * @param {Memory} _message - The memory object.
 * @returns {Promise<boolean>} - Returns true if validation passes, false otherwise.
 * @property {Function} handler - Asynchronous function to handle the action.
 * @param {IAgentRuntime} runtime - The agent runtime interface.
 * @param {Memory} message - The incoming message object.
 * @param {State} state - The state object.
 * @param {any} options - Additional options for the action.
 * @param {HandlerCallback} callback - The callback function to execute after handling.
 * @property {Object[]} examples - Array of examples demonstrating the action.
 * @property {Object[]} examples[0] - Example objects showing user and agent interactions.
 */
           
const rotateAction: Action = {
    name: "ROTATE",
    similes: ["ROTATE_TOY", "ROTATE_DEVICE", "START_ROTATION", "SPIN"],
    description: "Control rotation intensity of connected devices",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        try {
            await validateIntifaceConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const service = runtime.getService<IIntifaceService>(
            ServiceType.INTIFACE
        );
        if (!service || !service.rotate) {
            throw new Error("Rotation not supported");
        }

        const intensity = options?.intensity ?? 0.5;
        const duration = options?.duration ?? 2000;

        await service.rotate(intensity, duration);

        callback({
            text: `Rotating at ${intensity * 100}% intensity for ${duration}ms`,
        });
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Rotate the toy at 70% for 3 seconds" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Rotating at 70% intensity for 3000ms",
                    action: "ROTATE",
                    options: { intensity: 0.7, duration: 3000 },
                },
            },
        ],
    ],
};

/**
 * Represents a battery action that checks the battery level of connected devices.
 * @typedef {Object} Action
 * @property {string} name - The name of the action ("BATTERY").
 * @property {string[]} similes - The similes associated with the action.
 * @property {string} description - The description of the action.
 * @property {function} validate - The validation function for the action.
 * @param {IAgentRuntime} runtime - The runtime environment.
 * @param {Memory} _message - The message data.
 * @returns {Promise<boolean>} Whether the validation was successful or not.
 * @property {function} handler - The handler function for the action.
 * @param {IAgentRuntime} runtime - The runtime environment.
 * @param {Memory} message - The message data.
 * @param {State} state - The state of the agent.
 * @param {any} options - Any additional options.
 * @param {HandlerCallback} callback - The callback function.
 * @property {function[]} examples - An array of example interactions for the action.
 */
const batteryAction: Action = {
    name: "BATTERY",
    similes: [
        "CHECK_BATTERY",
        "BATTERY_LEVEL",
        "TOY_BATTERY",
        "DEVICE_BATTERY",
    ],
    description: "Check battery level of connected devices",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        try {
            await validateIntifaceConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const service = runtime.getService<IIntifaceService>(
            ServiceType.INTIFACE
        );
        if (!service || !service.getBatteryLevel) {
            throw new Error("Battery level check not supported");
        }

        try {
            const batteryLevel = await service.getBatteryLevel();
            callback({
                text: `Device battery level is at ${Math.round(batteryLevel * 100)}%`,
            });
        } catch (err) {
            callback({
                text: "Unable to get battery level. Device might not support this feature.",
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the battery level?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Device battery level is at 90%",
                    action: "BATTERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Check toy battery" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Device battery level is at 75%",
                    action: "BATTERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "How much battery is left?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Device battery level is at 45%",
                    action: "BATTERY",
                },
            },
        ],
    ],
};

/**
 * Interface representing a Vibrate Event.
 * @typedef {Object} VibrateEvent
 * @property {number} duration - The duration of the vibration event.
 * @property {number} strength - The strength of the vibration event.
 * @property {number} [deviceId] - The ID of the device the event is associated with (optional).
 */
interface VibrateEvent {
    duration: number;
    strength: number;
    deviceId?: number;
}

export const intifacePlugin: Plugin = {
    name: "intiface",
    description: "Controls intimate hardware devices",
    actions: [vibrateAction, rotateAction, batteryAction],
    evaluators: [],
    providers: [],
    services: [new IntifaceService()],
};

export default intifacePlugin;
