import { GMGNService } from './gmgnService';
import { TokenInfo, EarlyDetectionResult } from './types';
import EventEmitter from 'events';

export class TokenMonitor extends EventEmitter {
  private gmgnService: GMGNService;
  private monitoredTokens: Map<string, NodeJS.Timeout> = new Map();
  private checkInterval: number = 60000; // 1 minute default interval

  constructor(gmgnService: GMGNService) {
    super();
    this.gmgnService = gmgnService;
  }

  // Start monitoring a specific token
  // 开始监控特定代币
  async startMonitoring(tokenAddress: string, interval: number = this.checkInterval): Promise<void> {
    if (this.monitoredTokens.has(tokenAddress)) {
      console.log(`Token ${tokenAddress} is already being monitored`);
      return;
    }

    const timer = setInterval(async () => {
      try {
        const result = await this.gmgnService.checkEarlyDetection(tokenAddress);
        this.emit('tokenUpdate', result);
        
        // Emit specific events based on risk level
        // 根据风险等级发出特定事件
        this.emit(`riskLevel:${result.riskLevel}`, result);
        
        // Emit events for individual signals
        // 为各个信号发出事件
        Object.entries(result.signals).forEach(([signal, value]) => {
          if (value) {
            this.emit(`signal:${signal}`, result);
          }
        });
      } catch (error) {
        this.emit('error', { tokenAddress, error });
      }
    }, interval);

    this.monitoredTokens.set(tokenAddress, timer);
    console.log(`Started monitoring token: ${tokenAddress}`);
  }

  // Stop monitoring a specific token
  // 停止监控特定代币
  stopMonitoring(tokenAddress: string): void {
    const timer = this.monitoredTokens.get(tokenAddress);
    if (timer) {
      clearInterval(timer);
      this.monitoredTokens.delete(tokenAddress);
      console.log(`Stopped monitoring token: ${tokenAddress}`);
    }
  }

  // Get list of currently monitored tokens
  // 获取当前监控的代币列表
  getMonitoredTokens(): string[] {
    return Array.from(this.monitoredTokens.keys());
  }

  // Update monitoring interval for a specific token
  // 更新特定代币的监控间隔
  updateInterval(tokenAddress: string, newInterval: number): void {
    if (this.monitoredTokens.has(tokenAddress)) {
      this.stopMonitoring(tokenAddress);
      this.startMonitoring(tokenAddress, newInterval);
    }
  }

  // Stop monitoring all tokens
  // 停止监控所有代币
  stopAllMonitoring(): void {
    this.monitoredTokens.forEach((timer, tokenAddress) => {
      clearInterval(timer);
      console.log(`Stopped monitoring token: ${tokenAddress}`);
    });
    this.monitoredTokens.clear();
  }
} 