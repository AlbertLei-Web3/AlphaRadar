import { GMGNApiClient } from '../modules/gmgn';
import { gmgnConfig } from '../config/gmgn-config';
import fetch from 'node-fetch';
import dns from 'dns';
import { promisify } from 'util';

const resolveDNS = promisify(dns.resolve4);

async function testNetworkDiagnostics() {
  try {
    console.log('Running network diagnostics...');
    console.log('运行网络诊断...');

    // Test DNS resolution
    // 测试DNS解析
    console.log('\nTesting DNS resolution...');
    console.log('测试DNS解析...');
    try {
      const addresses = await resolveDNS('api.gmgn.ai');
      console.log('DNS resolution successful:', addresses);
    } catch (error) {
      console.error('DNS resolution failed:', error);
    }

    // Test HTTPS connection
    // 测试HTTPS连接
    console.log('\nTesting HTTPS connection...');
    console.log('测试HTTPS连接...');
    try {
      const response = await fetch('https://api.gmgn.ai/health', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      console.log('HTTPS test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return true;
    } catch (error) {
      console.error('HTTPS test failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Network diagnostics failed:', error);
    return false;
  }
}

async function testGMGNApi() {
  // Run network diagnostics first
  // 首先运行网络诊断
  const isNetworkOK = await testNetworkDiagnostics();
  if (!isNetworkOK) {
    console.error('Network diagnostics failed. Please check your network settings.');
    console.error('网络诊断失败。请检查你的网络设置。');
    process.exit(1);
  }

  // Use direct config, no proxy
  // 直接使用配置，不使用代理
  const config = {
    ...gmgnConfig
  };
  
  const apiClient = new GMGNApiClient(config);
  
  // Test token addresses
  // 测试代币地址
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const TEST_TOKEN = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs';

  try {
    console.log('\nTesting GMGN API Integration...');
    console.log('测试GMGN API集成...');

    // Test getTokenInfo
    // 测试getTokenInfo
    console.log('\nTesting getTokenInfo:');
    console.log('测试getTokenInfo:');
    try {
      const tokenInfo = await apiClient.getTokenInfo(SOL_ADDRESS);
      console.log('Token Info:', tokenInfo);
    } catch (error) {
      console.error('getTokenInfo failed:', error);
    }

    // Test getTokenPrice
    // 测试getTokenPrice
    console.log('\nTesting getTokenPrice:');
    console.log('测试getTokenPrice:');
    try {
      const price = await apiClient.getTokenPrice(SOL_ADDRESS);
      console.log('Token Price:', price);
    } catch (error) {
      console.error('getTokenPrice failed:', error);
    }

    // Test getTokenHolders
    // 测试getTokenHolders
    console.log('\nTesting getTokenHolders:');
    console.log('测试getTokenHolders:');
    try {
      const holders = await apiClient.getTokenHolders(TEST_TOKEN);
      console.log('Token Holders:', holders);
    } catch (error) {
      console.error('getTokenHolders failed:', error);
    }

    // Test getTokenTransactions
    // 测试getTokenTransactions
    console.log('\nTesting getTokenTransactions:');
    console.log('测试getTokenTransactions:');
    try {
      const transactions = await apiClient.getTokenTransactions(TEST_TOKEN);
      console.log('Token Transactions:', transactions);
    } catch (error) {
      console.error('getTokenTransactions failed:', error);
    }

    // Test getSwapRoute
    // 测试getSwapRoute
    console.log('\nTesting getSwapRoute:');
    console.log('测试getSwapRoute:');
    try {
      const swapRoute = await apiClient.getSwapRoute({
        tokenInAddress: SOL_ADDRESS,
        tokenOutAddress: TEST_TOKEN,
        inAmount: '1000000000', // 1 SOL
        fromAddress: '2kpJ5QRh16aRQ4oLZ5LnucHFDAZtEFz6omqWWMzDSNrx',
        slippage: 0.5
      });
      console.log('Swap Route:', swapRoute);
    } catch (error) {
      console.error('getSwapRoute failed:', error);
    }

  } catch (error) {
    console.error('API Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
// 运行测试
testGMGNApi().catch(console.error); 