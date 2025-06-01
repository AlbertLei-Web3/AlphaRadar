export interface GMGNConfig {
  apiHost: string;
  apiKey?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  holderCount: number;
  liquidity: number;
  price: number;
  volume24h: number;
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