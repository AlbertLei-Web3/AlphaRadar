import { EventEmitter } from 'events';
import { GMGNConfig, TokenInfo, TokenPrice, FilterConditions, EarlyDetectionResult } from './types';
import { GMGNApiClient } from './api/gmgnApiClient';

export class GMGNService extends EventEmitter {
  private apiClient: GMGNApiClient;
  private config: GMGNConfig;
  private defaultFilters: FilterConditions = {
    minLiquidity: 10, // 10 SOL
    minHolderCount: 100,
    minVolume24h: 5, // 5 SOL
    maxPriceImpact: 5, // 5%
    maxMarketCap: 1000000 // 1M SOL
  };

  constructor(config: GMGNConfig) {
    super();
    this.config = config;
    this.apiClient = new GMGNApiClient(config);
  }

  // Get token information
  // 获取代币信息
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    return this.apiClient.getTokenInfo(tokenAddress);
  }

  // Get token price
  // 获取代币价格
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    return this.apiClient.getTokenPrice(tokenAddress);
  }

  // Get token holders
  // 获取代币持有者
  async getTokenHolders(tokenAddress: string, page: number = 1, limit: number = 100) {
    return this.apiClient.getTokenHolders(tokenAddress, page, limit);
  }

  // Get token transactions
  // 获取代币交易
  async getTokenTransactions(tokenAddress: string, page: number = 1, limit: number = 100) {
    return this.apiClient.getTokenTransactions(tokenAddress, page, limit);
  }

  // Get swap route
  // 获取交换路由
  async getSwapRoute(params: {
    tokenInAddress: string;
    tokenOutAddress: string;
    inAmount: string;
    fromAddress: string;
    slippage: number;
    swapMode?: 'ExactIn' | 'ExactOut';
    fee?: number;
    isAntiMev?: boolean;
  }) {
    return this.apiClient.getSwapRoute(params);
  }

  // Submit transaction
  // 提交交易
  async submitTransaction(params: {
    chain: 'sol';
    signedTx: string;
    isAntiMev?: boolean;
  }) {
    return this.apiClient.submitTransaction(params);
  }

  // Get transaction status
  // 获取交易状态
  async getTransactionStatus(params: {
    hash: string;
    lastValidHeight: number;
  }) {
    return this.apiClient.getTransactionStatus(params);
  }

  // Check for early detection signals
  // 检查早期检测信号
  async checkEarlyDetection(tokenAddress: string, filters?: Partial<FilterConditions>): Promise<EarlyDetectionResult> {
    const [tokenInfo, price] = await Promise.all([
      this.getTokenInfo(tokenAddress),
      this.getTokenPrice(tokenAddress)
    ]);

    const activeFilters = { ...this.defaultFilters, ...filters };
    const volume24h = parseFloat(price.volume24h);
    const priceImpact = Math.abs(price.priceChange24h);

    const signals = {
      liquiditySignal: volume24h >= activeFilters.minLiquidity,
      holderSignal: tokenInfo.holderCount >= activeFilters.minHolderCount,
      volumeSignal: volume24h >= activeFilters.minVolume24h,
      priceImpactSignal: priceImpact <= activeFilters.maxPriceImpact
    };

    const score = this.calculateScore(signals);
    const riskLevel = this.determineRiskLevel(score);

    return {
      token: tokenInfo,
      score,
      riskLevel,
      signals,
      timestamp: Date.now()
    };
  }

  // Calculate score based on signals
  // 根据信号计算分数
  private calculateScore(signals: EarlyDetectionResult['signals']): number {
    let score = 0;
    if (signals.liquiditySignal) score += 25;
    if (signals.holderSignal) score += 25;
    if (signals.volumeSignal) score += 25;
    if (signals.priceImpactSignal) score += 25;
    return score;
  }

  // Determine risk level based on score
  // 根据分数确定风险等级
  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 75) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    return 'HIGH';
  }

  // Monitor token for changes
  // 监控代币变化
  async monitorToken(tokenAddress: string, interval: number = 60000): Promise<void> {
    let lastPrice: string | null = null;
    let lastHolderCount: number | null = null;

    const checkChanges = async () => {
      try {
        const [tokenInfo, price] = await Promise.all([
          this.getTokenInfo(tokenAddress),
          this.getTokenPrice(tokenAddress)
        ]);

        if (lastPrice !== price.price) {
          this.emit('priceChange', {
            tokenAddress,
            oldPrice: lastPrice,
            newPrice: price.price,
            timestamp: new Date().toISOString()
          });
          lastPrice = price.price;
        }

        if (lastHolderCount !== tokenInfo.holderCount) {
          this.emit('holderCountChange', {
            tokenAddress,
            oldCount: lastHolderCount,
            newCount: tokenInfo.holderCount,
            timestamp: new Date().toISOString()
          });
          lastHolderCount = tokenInfo.holderCount;
        }
      } catch (error) {
        this.emit('error', {
          tokenAddress,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };

    // Initial check
    // 初始检查
    await checkChanges();

    // Set up interval
    // 设置间隔
    setInterval(checkChanges, interval);
  }
} 