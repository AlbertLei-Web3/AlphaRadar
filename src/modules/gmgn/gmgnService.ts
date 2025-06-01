import { GMGNConfig, TokenInfo, FilterConditions, EarlyDetectionResult, GMGNResponse } from './types';
import fetch from 'node-fetch';

export class GMGNService {
  private config: GMGNConfig;
  private defaultFilters: FilterConditions = {
    minLiquidity: 10, // 10 SOL
    minHolderCount: 100,
    minVolume24h: 5, // 5 SOL
    maxPriceImpact: 5, // 5%
    maxMarketCap: 1000000 // 1M SOL
  };

  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(config: GMGNConfig) {
    this.config = config;
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const response = await this.makeRequest(`/defi/router/v1/sol/token/info?address=${tokenAddress}`);
    return this.parseTokenInfo(response.data);
  }

  async checkEarlyDetection(tokenAddress: string, filters?: Partial<FilterConditions>): Promise<EarlyDetectionResult> {
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const activeFilters = { ...this.defaultFilters, ...filters };
    
    const signals = {
      liquiditySignal: tokenInfo.liquidity >= activeFilters.minLiquidity,
      holderSignal: tokenInfo.holderCount >= activeFilters.minHolderCount,
      volumeSignal: tokenInfo.volume24h >= activeFilters.minVolume24h,
      priceImpactSignal: this.calculatePriceImpact(tokenInfo) <= activeFilters.maxPriceImpact
    };

    const score = this.calculateScore(signals, tokenInfo);
    const riskLevel = this.determineRiskLevel(score);

    return {
      token: tokenInfo,
      score,
      riskLevel,
      signals,
      timestamp: Date.now()
    };
  }

  private async makeRequest(endpoint: string, retryCount = 0): Promise<GMGNResponse> {
    try {
      const url = `${this.config.apiHost}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      if (retryCount < this.MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} for endpoint: ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
        return this.makeRequest(endpoint, retryCount + 1);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch data after ${this.MAX_RETRIES} retries: ${errorMessage}`);
    }
  }

  private parseTokenInfo(data: any): TokenInfo {
    if (!data) {
      throw new Error('Invalid token data received');
    }

    return {
      address: data.address || '',
      symbol: data.symbol || 'UNKNOWN',
      name: data.name || 'Unknown Token',
      decimals: data.decimals || 0,
      totalSupply: data.totalSupply || '0',
      holderCount: data.holderCount || 0,
      liquidity: data.liquidity || 0,
      price: data.price || 0,
      volume24h: data.volume24h || 0
    };
  }

  private calculatePriceImpact(tokenInfo: TokenInfo): number {
    if (!tokenInfo.liquidity || tokenInfo.liquidity === 0) {
      return 100; // Maximum price impact if no liquidity
    }
    return (tokenInfo.volume24h / tokenInfo.liquidity) * 100;
  }

  private calculateScore(signals: any, tokenInfo: TokenInfo): number {
    let score = 0;
    if (signals.liquiditySignal) score += 25;
    if (signals.holderSignal) score += 25;
    if (signals.volumeSignal) score += 25;
    if (signals.priceImpactSignal) score += 25;
    return score;
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 75) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    return 'HIGH';
  }
} 