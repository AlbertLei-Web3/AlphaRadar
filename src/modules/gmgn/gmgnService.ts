import { EventEmitter } from 'events';
import { GMGNConfig, TokenInfo, TokenPrice } from './types';
import { GMGNApiClient } from './api/gmgnApiClient';

export class GMGNService extends EventEmitter {
  private apiClient: GMGNApiClient;
  private config: GMGNConfig;

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