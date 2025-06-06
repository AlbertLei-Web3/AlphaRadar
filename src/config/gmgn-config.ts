import 'dotenv/config'; // 确保环境变量优先加载
import { GMGNConfig, FilterConditions } from '../modules/gmgn/types';

// GMGN API configuration
// GMGN API配置
export const gmgnConfig: GMGNConfig = {
  apiHost: 'https://gmgn.ai',
  apiKey: process.env.GMGN_API_KEY || '',
  // Proxy configuration (optional)
  // 代理配置（可选）
  proxy: process.env.USE_PROXY === 'true' ? {
    host: process.env.PROXY_HOST || '',
    // Use Shadowsocks port from V2rayN
    // 使用V2rayN的Shadowsocks端口
    port: parseInt(process.env.PROXY_PORT || '33002'),
    // Use SOCKS5 protocol for Shadowsocks
    // 使用SOCKS5协议用于Shadowsocks
    protocol: 'socks5',
    ...(process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD ? {
      auth: {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      }
    } : {})
  } : undefined
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