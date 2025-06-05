import { GMGNApiClient } from '../modules/gmgn';
import { gmgnConfig } from '../config/gmgn-config';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Test proxy connection
// 测试代理连接
async function testProxyConnection() {
  console.log('Testing proxy connection...');
  console.log('测试代理连接...');

  // Test direct connection first
  // 首先测试直接连接
  try {
    console.log('\nTesting direct connection:');
    console.log('测试直接连接:');
    const directResponse = await fetch('https://api.gmgn.ai/health', {
      timeout: 5000
    });
    console.log('Direct connection status:', directResponse.status);
    console.log('直接连接状态:', directResponse.status);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Direct connection failed (expected):', errorMessage);
    console.log('直接连接失败（预期中）:', errorMessage);
  }

  // Test proxy connection
  // 测试代理连接
  if (gmgnConfig.proxy) {
    try {
      console.log('\nTesting proxy connection:');
      console.log('测试代理连接:');
      const proxyUrl = `${gmgnConfig.proxy.protocol}://${gmgnConfig.proxy.host}:${gmgnConfig.proxy.port}`;
      const proxyAgent = new HttpsProxyAgent(proxyUrl);

      const proxyResponse = await fetch('https://api.gmgn.ai/health', {
        agent: proxyAgent,
        timeout: 5000
      });
      console.log('Proxy connection status:', proxyResponse.status);
      console.log('代理连接状态:', proxyResponse.status);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Proxy connection failed:', errorMessage);
      console.error('代理连接失败:', errorMessage);
    }
  } else {
    console.log('Proxy not configured');
    console.log('未配置代理');
  }
}

// Run the tests
// 运行测试
testProxyConnection().catch(console.error); 