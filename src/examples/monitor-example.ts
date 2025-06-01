import { GMGNService } from '../modules/gmgn/gmgnService';
import { TokenMonitor } from '../modules/gmgn/monitorService';
import { gmgnConfig } from '../config/gmgn-config';

async function main() {
  // Initialize GMGN service
  // 初始化GMGN服务
  const gmgnService = new GMGNService(gmgnConfig);
  
  // Create token monitor
  // 创建代币监控器
  const monitor = new TokenMonitor(gmgnService);

  // Example token addresses to monitor
  // 要监控的示例代币地址
  const tokensToMonitor = [
    'So11111111111111111111111111111111111111112', // SOL
    '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' // Example token
  ];

  // Set up event listeners
  // 设置事件监听器
  monitor.on('tokenUpdate', (result) => {
    console.log(`Token Update for ${result.token.symbol}:`, {
      score: result.score,
      riskLevel: result.riskLevel,
      price: result.token.price,
      volume24h: result.token.volume24h
    });
  });

  monitor.on('riskLevel:HIGH', (result) => {
    console.log(`⚠️ High Risk Alert for ${result.token.symbol}!`);
  });

  monitor.on('signal:liquiditySignal', (result) => {
    console.log(`💧 Good Liquidity for ${result.token.symbol}: ${result.token.liquidity} SOL`);
  });

  monitor.on('error', ({ tokenAddress, error }) => {
    console.error(`Error monitoring token ${tokenAddress}:`, error);
  });

  // Start monitoring tokens
  // 开始监控代币
  for (const tokenAddress of tokensToMonitor) {
    await monitor.startMonitoring(tokenAddress);
  }

  // Example: Update monitoring interval for a specific token
  // 示例：更新特定代币的监控间隔
  setTimeout(() => {
    monitor.updateInterval(tokensToMonitor[0], 30000); // Change to 30 seconds
    console.log('Updated monitoring interval for first token');
  }, 60000);

  // Example: Stop monitoring after 5 minutes
  // 示例：5分钟后停止监控
  setTimeout(() => {
    console.log('Stopping all monitoring...');
    monitor.stopAllMonitoring();
    process.exit(0);
  }, 300000);
}

// Run the example
// 运行示例
main().catch(console.error); 