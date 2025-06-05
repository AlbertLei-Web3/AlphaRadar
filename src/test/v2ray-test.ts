import { config } from 'dotenv';
import { GMGNApiClient } from '../modules/gmgn';
import { gmgnConfig } from '../config/gmgn-config';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Load environment variables
// 加载环境变量
config();

// Test V2rayN proxy connection
// 测试V2rayN代理连接
async function testV2rayConnection() {
  console.log('Testing V2rayN proxy connection...');
  console.log('测试V2rayN代理连接...');
  console.log('Environment variables loaded:', {
    USE_PROXY: process.env.USE_PROXY,
    PROXY_HOST: process.env.PROXY_HOST,
    PROXY_PORT: process.env.PROXY_PORT,
    PROXY_PROTOCOL: process.env.PROXY_PROTOCOL
  });
  console.log('环境变量已加载:', {
    USE_PROXY: process.env.USE_PROXY,
    PROXY_HOST: process.env.PROXY_HOST,
    PROXY_PORT: process.env.PROXY_PORT,
    PROXY_PROTOCOL: process.env.PROXY_PROTOCOL
  });

  // Test direct connection first
  // 首先测试直接连接
  try {
    console.log('\nTesting direct connection:');
    console.log('测试直接连接:');
    const directResponse = await fetch('https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route', {
      timeout: 5000
    });
    console.log('Direct connection status:', directResponse.status);
    console.log('直接连接状态:', directResponse.status);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Direct connection failed (expected):', errorMessage);
    console.log('直接连接失败（预期中）:', errorMessage);
  }

  // Test V2rayN proxy connection
  // 测试V2rayN代理连接
  if (gmgnConfig.proxy) {
    try {
      console.log('\nTesting V2rayN proxy connection:');
      console.log('测试V2rayN代理连接:');
      
      // V2rayN Shadowsocks proxy URL
      // V2rayN Shadowsocks代理URL
      const proxyUrl = `socks5://127.0.0.1:33002`;
      console.log('Using proxy URL:', proxyUrl);
      console.log('使用代理URL:', proxyUrl);
      
      const proxyAgent = new SocksProxyAgent(proxyUrl);

      // Test with a sample token swap route request
      // 使用示例代币交换路由请求进行测试
      const testParams = new URLSearchParams({
        token_in_address: 'So11111111111111111111111111111111111111112', // SOL
        token_out_address: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs', // Test token
        in_amount: '50000000', // 0.05 SOL
        from_address: '2kpJ5QRh16aRQ4oLZ5LnucHFDAZtEFz6omqWWMzDSNrx',
        slippage: '0.5'
      });

      const proxyResponse = await fetch(`https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route?${testParams}`, {
        agent: proxyAgent,
        timeout: 5000
      });
      console.log('Proxy connection status:', proxyResponse.status);
      console.log('代理连接状态:', proxyResponse.status);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log('API Response:', data);
        console.log('API响应:', data);
        console.log('V2rayN proxy connection successful!');
        console.log('V2rayN代理连接成功！');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('V2rayN proxy connection failed:', errorMessage);
      console.error('V2rayN代理连接失败:', errorMessage);
      
      // Additional troubleshooting information
      // 额外的故障排除信息
      console.log('\nTroubleshooting steps:');
      console.log('故障排除步骤:');
      console.log('1. Check if V2rayN is running');
      console.log('1. 检查V2rayN是否正在运行');
      console.log('2. Verify system proxy is enabled in V2rayN');
      console.log('2. 验证V2rayN中是否启用了系统代理');
      console.log('3. Check if port 33002 is correct for Shadowsocks');
      console.log('3. 检查Shadowsocks端口33002是否正确');
      console.log('4. Try accessing https://gmgn.ai in your browser');
      console.log('4. 尝试在浏览器中访问 https://gmgn.ai');
    }
  } else {
    console.log('Proxy not configured');
    console.log('未配置代理');
  }
}

// Run the tests
// 运行测试
testV2rayConnection().catch(console.error); 