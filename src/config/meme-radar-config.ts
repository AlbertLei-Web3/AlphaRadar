import { MemeRadarConfig } from '../pipeline/meme-radar-pipeline';
import { TDIConfig } from '../modules/analysis/TDIEngine';

/**
 * Create default TDI configuration optimized for MEME coin detection
 */
export function createDefaultTDIConfig(): TDIConfig {
  return {
    // Time windows - shorter for MEME coin volatility
    currentWindowMinutes: 10,    // Current window: 10 minutes
    baselineWindowHours: 6,      // Baseline comparison: 6 hours

    // Platform weights - prioritize high-signal sources
    platformWeights: new Map([
      ['twitter', 1.0],          // Twitter weight: 1.0 (base)
      ['reddit', 1.2],           // Reddit slightly higher (early signals)
      ['discord', 1.5],          // Discord highest (earliest signals)
      ['telegram', 1.3],         // Telegram high (crypto-focused)
    ]),

    // Engagement weights (α, β, γ, δ) - optimized for viral detection
    engagementWeights: {
      mentions: 2.0,             // α: New posts/mentions (most important)
      likes: 0.5,                // β: Likes (moderate signal)
      shares: 1.5,               // γ: Shares/retweets (viral indicator)
      comments: 1.0              // δ: Comments (engagement depth)
    },

    // Thresholds - tuned for MEME coin volatility
    thresholds: {
      brewingGrowthRate: 0.5,    // 50% growth rate = brewing
      surgingGrowthRate: 2.0,    // 200% growth rate = surging
      brewingZScore: 1.5,        // 1.5 standard deviations = brewing
      surgingZScore: 2.5         // 2.5 standard deviations = surging
    }
  };
}

/**
 * Create default MEME radar configuration
 */
export function createDefaultMemeRadarConfig(): Partial<MemeRadarConfig> {
  return {
    // Popular MEME coins to track (can be customized)
    trackedCoins: [
      'PEPE', 'WIF', 'BONK', 'SHIB', 'DOGE', 'FLOKI', 'BABYDOGE',
      'WOJAK', 'TURBO', 'LADYS', 'PEPE2', 'MILADY', 'RIBBIT'
    ],

    // TDI configuration
    tdiConfig: createDefaultTDIConfig(),

    // Alert thresholds - balanced for actionable signals
    alertConfig: {
      surgingThreshold: 1.5,     // 150% growth rate triggers surge alert
      fomothreshold: 0.6,        // 60% FOMO confidence triggers alert
      riskThreshold: 'medium'    // Alert on medium+ risk levels
    },

    // Execution frequency - every 5 minutes for real-time monitoring
    executionIntervalMinutes: 5
  };
}

/**
 * Create configuration for different environments
 */
export const configs = {
  development: {
    ...createDefaultMemeRadarConfig(),
    executionIntervalMinutes: 10,    // Slower in dev
    trackedCoins: ['PEPE', 'WIF', 'BONK'], // Fewer coins for testing
  },

  testing: {
    ...createDefaultMemeRadarConfig(),
    executionIntervalMinutes: 1,     // Fast for testing
    trackedCoins: ['PEPE'],          // Single coin for testing
    alertConfig: {
      surgingThreshold: 0.1,         // Low threshold for testing
      fomothreshold: 0.1,
      riskThreshold: 'medium' as const
    }
  },

  production: {
    ...createDefaultMemeRadarConfig(),
    executionIntervalMinutes: 3,     // Fast production monitoring
    // Full coin list in production
  }
};

/**
 * Environment-specific configuration loader
 */
export function loadConfig(env: 'development' | 'testing' | 'production' = 'development'): Partial<MemeRadarConfig> {
  const baseConfig = configs[env];
  
  // Override with environment variables if available
  const envOverrides: Partial<MemeRadarConfig> = {};

  // Data source configurations from environment
  if (process.env.TWITTER_API_KEY) {
    envOverrides.dataSources = {
      twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        enabled: true
      }
    };
  }

  // Sentiment configuration from environment
  if (process.env.OPENAI_API_KEY) {
    envOverrides.sentimentConfig = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      enabled: true
    } as MemeRadarConfig['sentimentConfig'];
  }

  // Merge configurations
  return {
    ...baseConfig,
    ...envOverrides,
    dataSources: {
      ...baseConfig.dataSources,
      ...envOverrides.dataSources
    },
    sentimentConfig: {
      ...baseConfig.sentimentConfig,
      ...envOverrides.sentimentConfig
    }
  };
}

/**
 * Validate configuration completeness
 */
export function validateConfig(config: Partial<MemeRadarConfig>): string[] {
  const errors: string[] = [];

  if (!config.trackedCoins || config.trackedCoins.length === 0) {
    errors.push('No tracked coins specified');
  }

  if (!config.dataSources || Object.keys(config.dataSources).length === 0) {
    errors.push('No data sources configured');
  }

  if (config.dataSources?.twitter?.enabled && !config.dataSources.twitter.apiKey) {
    errors.push('Twitter API key missing but Twitter source is enabled');
  }

  if (config.sentimentConfig?.enabled && !config.sentimentConfig.openaiApiKey) {
    errors.push('OpenAI API key missing but sentiment analysis is enabled');
  }

  if (!config.tdiConfig) {
    errors.push('TDI configuration missing');
  }

  return errors;
} 