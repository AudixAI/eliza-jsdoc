import { Anon } from "@anyone-protocol/anyone-client";

/**
 * Class representing a service for handling Anyone client instances.
 */
export class AnyoneClientService {
    private static instance: Anon | null = null;

/**
 * Returns an instance of the class Anon, or null if the instance does not exist.
 * @returns {Anon | null} The instance of the class Anon, or null if not available.
 */
    static getInstance(): Anon | null {
        return this.instance;
    }

/**
 * Initializes the Anon instance by creating a new instance with specified options 
 * and starting it if it is not already initialized.
 * @returns A Promise that resolves once the Anon instance has been initialized.
 */
    static async initialize(): Promise<void> {
        if (!this.instance) {
            this.instance = new Anon({
                displayLog: true,
                socksPort: 9050,
                autoTermsAgreement: true,
            });
            await this.instance.start();
        }
    }

/**
 * Stops the instance if it exists.
 * @returns A Promise that resolves when the instance is stopped
 */
    static async stop(): Promise<void> {
        if (this.instance) {
            await this.instance.stop();
            this.instance = null;
        }
    }
}
