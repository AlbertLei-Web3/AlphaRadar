// Proxy configuration interface
// 代理配置接口
export interface ProxyConfig {
  // Proxy server host address
  // 代理服务器主机地址
  host: string;
  // Proxy server port number
  // 代理服务器端口号
  port: number;
  // Proxy protocol (http or https)
  // 代理协议（http或https）
  protocol: 'http' | 'https';
  // Optional authentication credentials
  // 可选的认证凭据
  auth?: {
    // Proxy username
    // 代理用户名
    username: string;
    // Proxy password
    // 代理密码
    password: string;
  };
}

// GMGN API configuration interface
// GMGN API配置接口
export interface GMGNConfig {
  // API host URL
  // API主机URL
  apiHost: string;
  // Optional API key for authentication
  // 可选的API密钥用于认证
  apiKey?: string;
  // Optional proxy configuration
  // 可选的代理配置
  proxy?: ProxyConfig;
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