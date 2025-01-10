import { spawn, type ChildProcess } from "child_process";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Variable representing the running process of Intiface.
 */
let intifaceProcess: ChildProcess | null = null;

/**
 * Checks if a given port is available for use by attempting to create a server 
 * and listening on the specified port. 
 * @param {number} port - The port to be checked for availability.
 * @returns {Promise<boolean>} A Promise that resolves to true if the port is available,
 * and false if the port is not available.
 */
export async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net
            .createServer()
            .once("error", () => resolve(false))
            .once("listening", () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
}

/**
 * Function to start the Intiface Engine, which is responsible for managing connections
 * between user devices and the server.
 * @returns {Promise<void>} A promise that resolves when the Intiface Engine is successfully started.
 */
export async function startIntifaceEngine(): Promise<void> {
    const configPath = path.join(
        __dirname,
        "../src/intiface-user-device-config.json"
    );
    try {
        const child = spawn(
            path.join(__dirname, "../intiface-engine/intiface-engine"),
            [
                "--websocket-port",
                "12345",
                "--use-bluetooth-le",
                "--server-name",
                "Eliza Intiface Server",
                "--use-device-websocket-server",
                "--user-device-config-file",
                configPath,
            ],
            {
                detached: false,
                stdio: "ignore",
                windowsHide: true,
            }
        );

        child.unref();
        intifaceProcess = child;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.log("[utils] Intiface Engine started");
    } catch (error) {
        throw new Error(`Failed to start Intiface Engine: ${error}`);
    }
}

/**
 * Asynchronous function to perform cleanup actions for the Intiface Engine process.
 */
async function cleanup() {
    if (intifaceProcess) {
        console.log("[utils] Shutting down Intiface Engine...");
        try {
            // Try graceful shutdown first
            intifaceProcess.kill("SIGTERM");

            // Give it a moment to shut down gracefully
            await new Promise((r) => setTimeout(r, 1000));

            // Force kill if still running
            if (intifaceProcess.killed === false) {
                try {
                    const killCommand =
                        process.platform === "win32"
                            ? spawn("taskkill", [
                                  "/F",
                                  "/IM",
                                  "intiface-engine.exe",
                              ])
                            : spawn("pkill", ["intiface-engine"]);

                    await new Promise((resolve) => {
                        killCommand.on("close", resolve);
                    });
                } catch (killErr) {
                    console.error(
                        "[utils] Error force killing Intiface Engine:",
                        killErr
                    );
                }
            }
        } catch (err) {
            console.error(
                "[utils] Error during Intiface Engine shutdown:",
                err
            );
        } finally {
            intifaceProcess = null;
        }
    }
}

// Export cleanup for manual shutdown if needed
export { cleanup as shutdownIntifaceEngine };
