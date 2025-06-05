import fetch, { RequestInit } from 'node-fetch';
import { GMGNConfig } from '../types';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class GMGNApiClient {
  // Configuration object containing API settings
  // 包含API设置的配置对象
  private config: GMGNConfig;
  
  // Base URL for API requests
  // API请求的基础URL
  private readonly BASE_URL: string;
  
  // Maximum number of retry attempts
  // 最大重试次数
  private readonly MAX_RETRIES = 3;
  
  // Delay between retries in milliseconds
  // 重试之间的延迟（毫秒）
  private readonly RETRY_DELAY = 1000;
  
  // Request timeout in milliseconds
  // 请求超时时间（毫秒）
  private readonly TIMEOUT = 30000;

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
    
    // Default request options including headers and timeout
    // 默认请求选项，包括请求头和超时设置
    const defaultOptions: Partial<RequestInit> = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      timeout: this.TIMEOUT,
    };

    // Add proxy configuration if available
    // 如果配置了代理，添加代理设置
    if (this.config.proxy) {
      defaultOptions.agent = new HttpsProxyAgent({
        host: this.config.proxy.host,
        port: this.config.proxy.port.toString(),
        protocol: this.config.proxy.protocol,
        ...(this.config.proxy.auth && {
          auth: `${this.config.proxy.auth.username}:${this.config.proxy.auth.password}`
        })
      });
    }

    try {
      console.log(`Making request to: ${url}`);
      console.log('Request options:', JSON.stringify(defaultOptions, null, 2));
      
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response received:', JSON.stringify(data, null, 2));
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Request failed (attempt ${retryCount + 1}/${this.MAX_RETRIES}):`, {
        error: errorMessage,
        url,
        options: defaultOptions
      });

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