import fetch, { RequestInit } from 'node-fetch';
import { GMGNConfig } from '../types';
import HttpsProxyAgent from 'https-proxy-agent';

export class GMGNApiClient {
  private config: GMGNConfig;
  private readonly BASE_URL: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly TIMEOUT = 10000; // 10 seconds

  constructor(config: GMGNConfig) {
    this.config = config;
    this.BASE_URL = config.apiHost;
  }

  // Get token information
  // 获取代币信息
  async getTokenInfo(tokenAddress: string) {
    const endpoint = `/defi/router/v1/sol/token/info?address=${tokenAddress}`;
    return this.makeRequest(endpoint);
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
    const queryParams = new URLSearchParams({
      token_in_address: params.tokenInAddress,
      token_out_address: params.tokenOutAddress,
      in_amount: params.inAmount,
      from_address: params.fromAddress,
      slippage: params.slippage.toString(),
      ...(params.swapMode && { swap_mode: params.swapMode }),
      ...(params.fee && { fee: params.fee.toString() }),
      ...(params.isAntiMev && { is_anti_mev: params.isAntiMev.toString() })
    });

    const endpoint = `/defi/router/v1/sol/tx/get_swap_route?${queryParams.toString()}`;
    return this.makeRequest(endpoint);
  }

  // Submit transaction
  // 提交交易
  async submitTransaction(params: {
    chain: 'sol';
    signedTx: string;
    isAntiMev?: boolean;
  }) {
    const endpoint = '/txproxy/v1/send_transaction';
    const body = JSON.stringify(params);
    return this.makeRequest(endpoint, {
      method: 'POST',
      body
    });
  }

  // Get transaction status
  // 获取交易状态
  async getTransactionStatus(params: {
    hash: string;
    lastValidHeight: number;
  }) {
    const endpoint = `/defi/router/v1/sol/tx/get_transaction_status?hash=${params.hash}&last_valid_height=${params.lastValidHeight}`;
    return this.makeRequest(endpoint);
  }

  // Get token price
  // 获取代币价格
  async getTokenPrice(tokenAddress: string) {
    const endpoint = `/defi/router/v1/sol/token/price?address=${tokenAddress}`;
    return this.makeRequest(endpoint);
  }

  // Get token holders
  // 获取代币持有者
  async getTokenHolders(tokenAddress: string, page: number = 1, limit: number = 100) {
    const endpoint = `/defi/router/v1/sol/token/holders?address=${tokenAddress}&page=${page}&limit=${limit}`;
    return this.makeRequest(endpoint);
  }

  // Get token transactions
  // 获取代币交易
  async getTokenTransactions(tokenAddress: string, page: number = 1, limit: number = 100) {
    const endpoint = `/defi/router/v1/sol/token/transactions?address=${tokenAddress}&page=${page}&limit=${limit}`;
    return this.makeRequest(endpoint);
  }

  private async makeRequest(endpoint: string, options: Partial<RequestInit> = {}, retryCount = 0): Promise<any> {
    const url = `${this.BASE_URL}${endpoint}`;
    const defaultOptions: Partial<RequestInit> = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      timeout: this.TIMEOUT
    };

    // Add proxy if configured
    // 如果配置了代理，则添加代理
    if (this.config.proxy) {
      const proxyAgent = new HttpsProxyAgent(this.config.proxy);
      defaultOptions.agent = proxyAgent;
    }

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Request failed (attempt ${retryCount + 1}/${this.MAX_RETRIES}): ${errorMessage}`);

      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      throw new Error(`GMGN API request failed after ${this.MAX_RETRIES} attempts: ${errorMessage}`);
    }
  }
} 