/**
 * Binance API account information response
 */
/**
 * Interface representing the account information for a Binance account.
 * * @typedef { Object } BinanceAccountInfo
 * @property { number } makerCommission The maker commission percentage.
 * @property { number } takerCommission The taker commission percentage.
 * @property { number } buyerCommission The buyer commission percentage.
 * @property { number } sellerCommission The seller commission percentage.
 * @property { boolean } canTrade Flag indicating if trading is allowed.
 * @property { boolean } canWithdraw Flag indicating if withdrawals are allowed.
 * @property { boolean } canDeposit Flag indicating if deposits are allowed.
 * @property { number } updateTime The time when the account information was last updated.
 * @property { string } accountType The type of account.
 * @property {BinanceBalance[]} balances An array of balances for different assets.
 * @property {string[]} permissions An array of permissions granted for the account.
 */
export interface BinanceAccountInfo {
    makerCommission: number;
    takerCommission: number;
    buyerCommission: number;
    sellerCommission: number;
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
    updateTime: number;
    accountType: string;
    balances: BinanceBalance[];
    permissions: string[];
}

/**
 * Balance information for a single asset
 */
export interface BinanceBalance {
    asset: string;
    free: string; // Available balance
    locked: string; // Locked in orders
}

/**
 * Account trade list response
 */
export interface BinanceAccountTrade {
    symbol: string;
    id: number;
    orderId: number;
    orderListId: number;
    price: string;
    qty: string;
    quoteQty: string;
    commission: string;
    commissionAsset: string;
    time: number;
    isBuyer: boolean;
    isMaker: boolean;
    isBestMatch: boolean;
}

/**
 * Parameters for account trade list query
 */
export interface BinanceTradeListParams {
    symbol: string;
    orderId?: number;
    startTime?: number;
    endTime?: number;
    fromId?: number;
    limit?: number;
}

/**
 * Account status response
 */
export interface BinanceAccountStatus {
    data: string; // "Normal", "Margin", "Futures", etc.
}

/**
 * API trading status response
 */
export interface BinanceApiTradingStatus {
    data: {
        isLocked: boolean;
        plannedRecoverTime: number;
        triggerCondition: {
            gcr: number;
            ifer: number;
            ufr: number;
        };
        updateTime: number;
    };
}
