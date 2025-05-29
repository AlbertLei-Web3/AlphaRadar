/**
 * MEME Radar Example - Demonstrating the new pipeline
 * 
 * This example shows how to set up and run the MEME coin early detection system
 * 
 * Prerequisites:
 * 1. Set TWITTER_API_KEY environment variable
 * 2. Set OPENAI_API_KEY environment variable
 * 3. Run: npm install
 * 4. Run: npx ts-node examples/meme-radar-example.ts
 */

import { MemeRadarPipeline, MemeRadarConfig } from '../src/pipeline/meme-radar-pipeline';
import { loadConfig, validateConfig } from '../src/config/meme-radar-config';

async function runMemeRadarExample() {
  console.log('🚀 Starting MEME Radar Example...\n');

  // 1. Load configuration
  const config = loadConfig('development') as MemeRadarConfig;
  
  // Add API keys (in real use, these would come from environment variables)
  config.dataSources = {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || 'your-twitter-bearer-token',
      enabled: true
    }
  };

  config.sentimentConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key', 
    enabled: true
  };

  // 2. Validate configuration
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    console.error('❌ Configuration errors:');
    configErrors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  // 3. Initialize the pipeline
  const pipeline = new MemeRadarPipeline(config);
  
  try {
    await pipeline.initialize();
    console.log('✅ Pipeline initialized successfully\n');

    // 4. Check system health
    const health = await pipeline.getHealthStatus();
    console.log('🏥 System Health Check:');
    console.log(`  Overall: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    health.sources.forEach((status, source) => {
      console.log(`  ${source}: ${status ? '✅' : '❌'}`);
    });
    console.log('');

    // 5. Run a single scan
    console.log('🔍 Running single scan...\n');
    const result = await pipeline.runScan();
    
    // 6. Display results
    console.log('📊 SCAN RESULTS:');
    console.log('================');
    console.log(`Timestamp: ${result.timestamp.toISOString()}`);
    console.log(`Total data points: ${result.summary.totalDataPoints}`);
    console.log(`Active sources: ${result.summary.activeSources.join(', ')}`);
    console.log(`Market sentiment: ${result.summary.overallMarketSentiment}\n`);

    // Top surging coins
    console.log('🚀 TOP SURGING COINS:');
    if (result.topSurging.length === 0) {
      console.log('  No surging coins detected\n');
    } else {
      result.topSurging.forEach((coin, index) => {
        console.log(`  ${index + 1}. ${coin.symbol}`);
        console.log(`     Growth: +${(coin.growthRate * 100).toFixed(1)}%`);
        console.log(`     TDI: ${coin.currentTDI.toFixed(2)} (baseline: ${coin.baselineTDI.toFixed(2)})`);
        console.log(`     Status: ${coin.status} | Confidence: ${(coin.confidence * 100).toFixed(1)}%`);
        console.log(`     Z-Score: ${coin.zScore.toFixed(2)}\n`);
      });
    }

    // Top discussed coins
    console.log('💬 TOP DISCUSSED COINS:');
    if (result.topDiscussed.length === 0) {
      console.log('  No discussed coins detected\n');
    } else {
      result.topDiscussed.slice(0, 5).forEach((coin, index) => {
        console.log(`  ${index + 1}. ${coin.symbol} - TDI: ${coin.currentTDI.toFixed(2)}`);
      });
      console.log('');
    }

    // Sentiment overview
    console.log('🧠 SENTIMENT OVERVIEW:');
    const sentiment = result.sentimentOverview.aggregatedSentiment;
    console.log(`  Dominant: ${sentiment.dominant}`);
    console.log(`  Confidence: ${(sentiment.averageConfidence * 100).toFixed(1)}%`);
    console.log(`  Risk Level: ${sentiment.riskLevel}`);
    
    if (sentiment.distribution.size > 0) {
      console.log('  Distribution:');
      sentiment.distribution.forEach((count, sentimentType) => {
        console.log(`    ${sentimentType}: ${count}`);
      });
    }
    console.log('');

    // Alerts
    console.log('🚨 ALERTS:');
    if (result.alerts.length === 0) {
      console.log('  No alerts generated\n');
    } else {
      result.alerts.forEach((alert, index) => {
        const priorityEmoji = {
          critical: '🔴',
          high: '🟠', 
          medium: '🟡',
          low: '🟢'
        };
        
        console.log(`  ${priorityEmoji[alert.priority]} [${alert.priority.toUpperCase()}] ${alert.symbol}`);
        console.log(`     ${alert.message}`);
        console.log(`     Type: ${alert.type} | Time: ${alert.data.timestamp.toLocaleTimeString()}\n`);
      });
    }

    // 7. Demonstrate continuous monitoring (run for 30 seconds)
    console.log('🔄 Starting continuous monitoring for 30 seconds...\n');
    await pipeline.startMonitoring();
    
    // Stop after 30 seconds
    setTimeout(() => {
      pipeline.stopMonitoring();
      console.log('\n✅ Example completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Set up your Twitter API credentials');
      console.log('2. Set up your OpenAI API key');
      console.log('3. Customize tracked coins in config');
      console.log('4. Adjust TDI thresholds based on your needs');
      console.log('5. Set up notification endpoints (Telegram, Discord, etc.)');
      console.log('6. Deploy for production monitoring');
      
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('❌ Error running MEME Radar:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the example
runMemeRadarExample().catch(console.error); 