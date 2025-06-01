export interface GMGNConfig {
  apiHost: string;
  apiKey?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holderCount: number;
  createdAt: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
}

export interface TokenTransaction {
  hash: string;
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  type: 'transfer' | 'swap' | 'other';
}

export interface SwapRoute {
  route: {
    path: string[];
    pools: string[];
    amounts: string[];
  };
  priceImpact: number;
  outAmount: string;
  fee: string;
}

export interface TransactionStatus {
  status: 'success' | 'failed' | 'pending';
  hash: string;
  blockNumber?: number;
  error?: string;
}

export interface TokenPrice {
  price: string;
  timestamp: string;
  volume24h: string;
  priceChange24h: number;
}

export interface FilterConditions {
  minLiquidity: number;  // in SOL
  minHolderCount: number;
  minVolume24h: number;  // in SOL
  maxPriceImpact: number;  // percentage
  maxMarketCap: number;  // in SOL
}

export interface EarlyDetectionResult {
  token: TokenInfo;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: {
    liquiditySignal: boolean;
    holderSignal: boolean;
    volumeSignal: boolean;
    priceImpactSignal: boolean;
  };
  timestamp: number;
}

export interface GMGNResponse {
  code: number;
  msg: string;
  data: any;
} 