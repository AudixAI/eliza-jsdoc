import { VALIDATION } from "../constants/defaults";
import { ERROR_MESSAGES } from "../constants/errors";
import { BinanceTickerResponse } from "../types/api/price";
import { PriceCheckRequest, PriceResponse } from "../types/internal/config";
import { BinanceError } from "../types/internal/error";
import { BaseService } from "./base";

/**
 * Service for handling price-related operations
 */
/**
 * Service for handling price-related operations
 * PriceService class provides methods for fetching and formatting price data.
 * @extends {BaseService}
 * @description Get current price for a symbol
 * @param {PriceCheckRequest} request - The request object containing symbol and quoteCurrency
 * @returns {Promise<PriceResponse>} The response object containing symbol, price, and timestamp
 * @description Validates symbol format
 * @param {string} symbol - The symbol to validate
 * @throws {BinanceError} if symbol format is invalid
 * @description Format price for display
 * @param {number | string} price - The price to format
 * @returns {string} The formatted price as a string
 */
export class PriceService extends BaseService {
    /**
     * Get current price for a symbol
     */
    async getPrice(request: PriceCheckRequest): Promise<PriceResponse> {
        try {
            this.validateSymbol(request.symbol);

            const symbol = `${request.symbol}${request.quoteCurrency}`;
            const response = await this.client.tickerPrice(symbol);
            const data = response.data as BinanceTickerResponse;

            return {
                symbol,
                price: data.price,
                timestamp: Date.now(),
            };
        } catch (error) {
            throw this.handleError(error, request.symbol);
        }
    }

    /**
     * Validates symbol format
     */
    private validateSymbol(symbol: string): void {
        const trimmedSymbol = symbol.trim();
        if (
            trimmedSymbol.length < VALIDATION.SYMBOL.MIN_LENGTH ||
            trimmedSymbol.length > VALIDATION.SYMBOL.MAX_LENGTH
        ) {
            throw new BinanceError(ERROR_MESSAGES.INVALID_SYMBOL);
        }
    }

    /**
     * Format price for display
     */
    static formatPrice(price: number | string): string {
        const numPrice = typeof price === "string" ? parseFloat(price) : price;
        return new Intl.NumberFormat("en-US", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(numPrice);
    }
}
