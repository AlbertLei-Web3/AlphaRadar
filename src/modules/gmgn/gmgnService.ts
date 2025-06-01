import { GMGNConfig, TokenInfo, FilterConditions, EarlyDetectionResult, GMGNResponse } from './types';

export class GMGNService {
  private config: GMGNConfig;
  private defaultFilters: FilterConditions = {
    minLiquidity: 10, // 10 SOL
    minHolderCount: 100,
    minVolume24h: 5, // 5 SOL
    maxPriceImpact: 5, // 5%
    maxMarketCap: 1000000 // 1M SOL
  };

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

  private async makeRequest(endpoint: string): Promise<GMGNResponse> {
    const url = `${this.config.apiHost}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });
    return response.json();
  }

  private parseTokenInfo(data: any): TokenInfo {
    // Implementation will depend on actual GMGN API response structure
    return {
      address: data.address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      totalSupply: data.totalSupply,
      holderCount: data.holderCount,
      liquidity: data.liquidity,
      price: data.price,
      volume24h: data.volume24h
    };
  }

  private calculatePriceImpact(tokenInfo: TokenInfo): number {
    // Implement price impact calculation based on liquidity and volume
    return 0; // Placeholder
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