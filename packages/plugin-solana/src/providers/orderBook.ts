import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
/**
 * Represents an order object with details about a transaction.
 * @typedef {object} Order
 * @property {string} userId - The ID of the user making the transaction.
 * @property {string} ticker - The stock ticker symbol being traded.
 * @property {string} contractAddress - The address of the contract being used.
 * @property {string} timestamp - The timestamp of the transaction.
 * @property {number} buyAmount - The amount being purchased.
 * @property {number} price - The price per unit of the transaction.
 */
interface Order {
    userId: string;
    ticker: string;
    contractAddress: string;
    timestamp: string;
    buyAmount: number;
    price: number;
}

/**
 * Retrieves the user's order book from a JSON file, filters the orders for the current user,
 * calculates the total profit based on the price difference of each order and the current asset price,
 * and returns a message with the total profit made by the user for the agent.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime environment.
 * @param {Memory} message - The message containing the user ID.
 * @param {State} [_state] - The optional state of the agent.
 * @returns {string} A message indicating the total profit made by the user for the agent.
 */
const orderBookProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, _state?: State) => {
        const userId = message.userId;

        // Read the order book from the JSON file
        const orderBookPath =
            runtime.getSetting("orderBookPath") ?? "solana/orderBook";

        const orderBook: Order[] = [];

        const cachedOrderBook =
            await runtime.cacheManager.get<Order[]>(orderBookPath);

        if (cachedOrderBook) {
            orderBook.push(...cachedOrderBook);
        }

        // Filter the orders for the current user
        const userOrders = orderBook.filter((order) => order.userId === userId);

        let totalProfit = 0;
        for (const order of userOrders) {
            // Get the current price of the asset (replace with actual price fetching logic)
            const currentPrice = 120;

            const priceDifference = currentPrice - order.price;
            const orderProfit = priceDifference * order.buyAmount;
            totalProfit += orderProfit;
        }

        return `The user has made a total profit of $${totalProfit.toFixed(2)} for the agent based on their recorded buy orders.`;
    },
};

export { orderBookProvider };
