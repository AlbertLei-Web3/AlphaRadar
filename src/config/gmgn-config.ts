import { GMGNConfig, FilterConditions } from '../modules/gmgn/types';

// GMGN API configuration
// GMGN API配置
export const gmgnConfig: GMGNConfig = {
  apiHost: 'https://api.gmgn.ai',
  apiKey: process.env.GMGN_API_KEY || ''
};

export const defaultFilterConditions: FilterConditions = {
  minLiquidity: 10, // 10 SOL minimum liquidity
  minHolderCount: 100, // Minimum number of holders
  minVolume24h: 5, // 5 SOL minimum 24h volume
  maxPriceImpact: 5, // Maximum 5% price impact
  maxMarketCap: 1000000 // Maximum 1M SOL market cap
};

// Risk levels for different score ranges
export const riskLevels = {
  LOW: { min: 75, max: 100 },
  MEDIUM: { min: 50, max: 74 },
  HIGH: { min: 0, max: 49 }
}; 