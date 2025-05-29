import { SourceManager } from '../modules/data_sources/SourceManager';
import { TwitterSource } from '../modules/data_sources/TwitterSource';
import { TDIEngine, TDIConfig, TDIResult } from '../modules/analysis/TDIEngine';
import { MemeSentimentAnalyzer, SentimentBatch } from '../modules/sentiment';
import { RawDataItem } from '../modules/data_sources/DataSourceInterface';

export interface MemeRadarConfig {
  // Tracked MEME coins
  trackedCoins: string[]; // e.g., ['PEPE', 'WIF', 'BONK', 'SHIB']
  
  // Data source configurations
  dataSources: {
    twitter?: {
      apiKey: string;
      enabled: boolean;
    };
    // Future: reddit, discord, etc.
  };
  
  // TDI Engine configuration
  tdiConfig: TDIConfig;
  
  // Sentiment analysis
  sentimentConfig: {
    openaiApiKey: string;
    enabled: boolean;
  };
  
  // Alert thresholds
  alertConfig: {
    surgingThreshold: number;    // Growth rate threshold for alerts
    fomothreshold: number;       // FOMO sentiment threshold
    riskThreshold: 'medium' | 'high' | 'critical'; // Risk level for alerts
  };
  
  // Execution frequency
  executionIntervalMinutes: number;
}

export interface MemeRadarResult {
  timestamp: Date;
  topSurging: TDIResult[];
  topDiscussed: TDIResult[];
  sentimentOverview: SentimentBatch;
  alerts: Alert[];
  summary: {
    totalCoinsTracked: number;
    totalDataPoints: number;
    activeSources: string[];
    overallMarketSentiment: string;
  };
}

export interface Alert {
  type: 'surge_detected' | 'fomo_spike' | 'risk_warning' | 'new_trend';
  priority: 'low' | 'medium' | 'high' | 'critical';
  symbol: string;
  message: string;
  data: {
    tdi?: TDIResult;
    sentiment?: any;
    timestamp: Date;
  };
}

export class MemeRadarPipeline {
  private sourceManager: SourceManager;
  private tdiEngine: TDIEngine;
  private sentimentAnalyzer: MemeSentimentAnalyzer | null = null;
  private config: MemeRadarConfig;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: MemeRadarConfig) {
    this.config = config;
    this.sourceManager = new SourceManager();
    this.tdiEngine = new TDIEngine(config.tdiConfig);
    
    if (config.sentimentConfig.enabled && config.sentimentConfig.openaiApiKey) {
      this.sentimentAnalyzer = new MemeSentimentAnalyzer(config.sentimentConfig.openaiApiKey);
    }
  }

  /**
   * Initialize the pipeline with data sources
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing MEME Radar Pipeline...');

    // Initialize Twitter source if configured
    if (this.config.dataSources.twitter?.enabled && this.config.dataSources.twitter.apiKey) {
      const twitterSource = new TwitterSource();
      await this.sourceManager.registerSource(twitterSource, {
        apiKey: this.config.dataSources.twitter.apiKey,
        timeout: 30000
      });
    }

    // TODO: Add other data sources (Reddit, Discord, etc.)

    console.log('✅ MEME Radar Pipeline initialized successfully');
  }

  /**
   * Run a single scan cycle
   */
  async runScan(): Promise<MemeRadarResult> {
    console.log('🔍 Starting MEME Radar scan...');
    const startTime = Date.now();

    try {
      // 1. Fetch raw data from all sources
      const rawData = await this.sourceManager.fetchFromAllSources(this.config.trackedCoins);
      
      if (rawData.length === 0) {
        console.log('⚠️ No data retrieved from sources');
        return this.createEmptyResult();
      }

      // 2. Calculate TDI for all tracked coins
      const tdiResults = await this.tdiEngine.calculateTDI(rawData, this.config.trackedCoins);

      // 3. Analyze sentiment (if enabled)
      let sentimentBatch: SentimentBatch | null = null;
      if (this.sentimentAnalyzer) {
        sentimentBatch = await this.sentimentAnalyzer.analyzeBatch(rawData);
      }

      // 4. Generate alerts
      const alerts = this.generateAlerts(tdiResults, sentimentBatch);

      // 5. Create result summary
      const result: MemeRadarResult = {
        timestamp: new Date(),
        topSurging: this.getTopSurging(tdiResults, 10),
        topDiscussed: this.getTopDiscussed(tdiResults, 10),
        sentimentOverview: sentimentBatch || this.createEmptySentimentBatch(),
        alerts,
        summary: {
          totalCoinsTracked: this.config.trackedCoins.length,
          totalDataPoints: rawData.length,
          activeSources: this.sourceManager.getEnabledSources().map(s => s.name),
          overallMarketSentiment: sentimentBatch?.aggregatedSentiment.dominant || 'unknown'
        }
      };

      const scanTime = Date.now() - startTime;
      console.log(`✅ MEME Radar scan completed in ${scanTime}ms`);
      console.log(`📊 Found ${alerts.length} alerts, tracking ${tdiResults.length} coins`);

      return result;
    } catch (error) {
      console.error('❌ MEME Radar scan failed:', error);
      throw error;
    }
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    console.log(`🔄 Starting continuous monitoring (every ${this.config.executionIntervalMinutes} minutes)`);
    this.isRunning = true;

    // Run initial scan
    await this.runScan();

    // Set up interval for continuous monitoring
    this.intervalId = setInterval(async () => {
      try {
        await this.runScan();
      } catch (error) {
        console.error('❌ Scheduled scan failed:', error);
      }
    }, this.config.executionIntervalMinutes * 60000);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('⚠️ Monitoring not running');
      return;
    }

    console.log('🛑 Stopping continuous monitoring');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Add a new coin to tracking list
   */
  addTrackedCoin(symbol: string): void {
    if (!this.config.trackedCoins.includes(symbol.toUpperCase())) {
      this.config.trackedCoins.push(symbol.toUpperCase());
      console.log(`📈 Added ${symbol} to tracking list`);
    }
  }

  /**
   * Remove a coin from tracking list
   */
  removeTrackedCoin(symbol: string): void {
    const index = this.config.trackedCoins.indexOf(symbol.toUpperCase());
    if (index > -1) {
      this.config.trackedCoins.splice(index, 1);
      console.log(`📉 Removed ${symbol} from tracking list`);
    }
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; sources: Map<string, boolean> }> {
    const sourceHealth = await this.sourceManager.healthCheckAll();
    const healthy = Array.from(sourceHealth.values()).some(status => status);

    return {
      healthy,
      sources: sourceHealth
    };
  }

  private getTopSurging(results: TDIResult[], limit: number): TDIResult[] {
    return results
      .filter(r => r.status === 'surging' || r.status === 'brewing')
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, limit);
  }

  private getTopDiscussed(results: TDIResult[], limit: number): TDIResult[] {
    return results
      .sort((a, b) => b.currentTDI - a.currentTDI)
      .slice(0, limit);
  }

  private generateAlerts(tdiResults: TDIResult[], sentimentBatch: SentimentBatch | null): Alert[] {
    const alerts: Alert[] = [];

    // TDI-based alerts
    for (const tdi of tdiResults) {
      // Surge detection alert
      if (tdi.growthRate >= this.config.alertConfig.surgingThreshold) {
        alerts.push({
          type: 'surge_detected',
          priority: tdi.status === 'surging' ? 'high' : 'medium',
          symbol: tdi.symbol,
          message: `${tdi.symbol} discussion surging! Growth: +${(tdi.growthRate * 100).toFixed(1)}% (Z-Score: ${tdi.zScore.toFixed(2)})`,
          data: { tdi, timestamp: new Date() }
        });
      }

      // New trend alert (brewing coins with high confidence)
      if (tdi.status === 'brewing' && tdi.confidence > 0.7) {
        alerts.push({
          type: 'new_trend',
          priority: 'medium',
          symbol: tdi.symbol,
          message: `${tdi.symbol} showing early brewing signals with high confidence (${(tdi.confidence * 100).toFixed(1)}%)`,
          data: { tdi, timestamp: new Date() }
        });
      }
    }

    // Sentiment-based alerts
    if (sentimentBatch) {
      const { aggregatedSentiment } = sentimentBatch;

      // FOMO spike alert
      if (aggregatedSentiment.dominant === 'fomo' && aggregatedSentiment.averageConfidence > this.config.alertConfig.fomothreshold) {
        alerts.push({
          type: 'fomo_spike',
          priority: 'high',
          symbol: 'MARKET',
          message: `Market-wide FOMO detected! Dominant sentiment: ${aggregatedSentiment.dominant} (${(aggregatedSentiment.averageConfidence * 100).toFixed(1)}% confidence)`,
          data: { sentiment: aggregatedSentiment, timestamp: new Date() }
        });
      }

      // Risk warning alert
      if (this.shouldTriggerRiskAlert(aggregatedSentiment.riskLevel)) {
        alerts.push({
          type: 'risk_warning',
          priority: aggregatedSentiment.riskLevel === 'critical' ? 'critical' : 'high',
          symbol: 'MARKET',
          message: `Risk level elevated: ${aggregatedSentiment.riskLevel.toUpperCase()}. Exercise caution.`,
          data: { sentiment: aggregatedSentiment, timestamp: new Date() }
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private shouldTriggerRiskAlert(riskLevel: string): boolean {
    const configThreshold = this.config.alertConfig.riskThreshold;
    const levels = { medium: 1, high: 2, critical: 3 };
    return levels[riskLevel as keyof typeof levels] >= levels[configThreshold];
  }

  private createEmptyResult(): MemeRadarResult {
    return {
      timestamp: new Date(),
      topSurging: [],
      topDiscussed: [],
      sentimentOverview: this.createEmptySentimentBatch(),
      alerts: [],
      summary: {
        totalCoinsTracked: this.config.trackedCoins.length,
        totalDataPoints: 0,
        activeSources: [],
        overallMarketSentiment: 'unknown'
      }
    };
  }

  private createEmptySentimentBatch(): SentimentBatch {
    return {
      results: new Map(),
      aggregatedSentiment: {
        dominant: 'neutral',
        distribution: new Map(),
        averageConfidence: 0,
        riskLevel: 'low'
      }
    };
  }
} 