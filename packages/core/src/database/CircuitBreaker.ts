/**
 * Represents the possible states of a circuit breaker.
 * Can be "CLOSED", "OPEN", or "HALF_OPEN".
 */
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Represents a Circuit Breaker implementation to manage fault tolerance in asynchronous operations.
 * This circuit breaker can be in one of three states: CLOSED, OPEN, or HALF_OPEN.
 * The circuit breaker transitions between these states based on the number of failures and successful attempts.
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = "CLOSED";
    private failureCount: number = 0;
    private lastFailureTime?: number;
    private halfOpenSuccesses: number = 0;

    private readonly failureThreshold: number;
    private readonly resetTimeout: number;
    private readonly halfOpenMaxAttempts: number;

/**
 * Constructor for creating a circuit breaker configuration.
 * @param {Object} config - Configuration options for the circuit breaker.
 * @param {number} [config.failureThreshold] - Number of consecutive failures to trigger opening the circuit.
 * @param {number} [config.resetTimeout] - Time in milliseconds before attempting to retry after the circuit is open.
 * @param {number} [config.halfOpenMaxAttempts] - Maximum number of attempts in half-open state before fully closing or opening the circuit.
 */
    constructor(
        private readonly config: {
            failureThreshold?: number;
            resetTimeout?: number;
            halfOpenMaxAttempts?: number;
        } = {}
    ) {
        this.failureThreshold = config.failureThreshold ?? 5;
        this.resetTimeout = config.resetTimeout ?? 60000;
        this.halfOpenMaxAttempts = config.halfOpenMaxAttempts ?? 3;
    }

/**
 * Executes the specified operation within the circuit breaker.
 * If the circuit breaker is OPEN, it checks if the reset timeout has passed, 
 * and transitions to HALF_OPEN state if necessary.
 * Executes the operation and handles successes/failures based on the circuit breaker state.
 * 
 * @template T - The type of the result returned by the operation.
 * @param {() => Promise<T>} operation - The operation to execute within the circuit breaker.
 * @returns {Promise<T>} - A Promise that resolves with the result of the operation.
 */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === "OPEN") {
            if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
                this.state = "HALF_OPEN";
                this.halfOpenSuccesses = 0;
            } else {
                throw new Error("Circuit breaker is OPEN");
            }
        }

        try {
            const result = await operation();

            if (this.state === "HALF_OPEN") {
                this.halfOpenSuccesses++;
                if (this.halfOpenSuccesses >= this.halfOpenMaxAttempts) {
                    this.reset();
                }
            }

            return result;
        } catch (error) {
            this.handleFailure();
            throw error;
        }
    }

/**
* Increments the failure count and sets the last failure time. 
* If the failure count exceeds the threshold, changes the state to "OPEN".
*/
    private handleFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (
            this.state !== "OPEN" &&
            this.failureCount >= this.failureThreshold
        ) {
            this.state = "OPEN";
        }
    }

/**
 * Resets the state, failure count, and last failure time.
 */
    private reset(): void {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.lastFailureTime = undefined;
    }

/**
 * Get the current state of the system.
 * 
 * @returns {"CLOSED" | "OPEN" | "HALF_OPEN"} The current state of the system.
 */
    getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
        return this.state;
    }
}
