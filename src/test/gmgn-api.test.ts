import { GMGNApiClient } from '../modules/gmgn';
import { gmgnConfig } from '../config/gmgn-config';

async function testGMGNApi() {
  // Configure proxy for VPN
  // 配置VPN代理
  const config = {
    ...gmgnConfig,
    proxy: 'http://127.0.0.1:48004' // Your VPN proxy port
  };
  
  const apiClient = new GMGNApiClient(config);
  
  // Test token addresses
  // 测试代币地址
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const TEST_TOKEN = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs';

  try {
    console.log('Testing GMGN API Integration...');
    console.log('测试GMGN API集成...');
    console.log('Using proxy:', config.proxy);
    console.log('使用代理:', config.proxy);

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