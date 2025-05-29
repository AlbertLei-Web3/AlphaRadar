import { RawDataItem } from '../data_sources/DataSourceInterface';

export interface TDIResult {
  symbol: string;
  currentTDI: number;
  baselineTDI: number;
  growthRate: number;
  zScore: number;
  status: 'silent' | 'brewing' | 'surging' | 'peaked' | 'declining';
  confidence: number;
  breakdownBySource: Map<string, number>;
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export interface TDIConfig {
  // Time windows
  currentWindowMinutes: number; // e.g., 10 minutes for current data
  baselineWindowHours: number;  // e.g., 6 hours for baseline calculation
  
  // Platform weights
  platformWeights: Map<string, number>;
  
  // Engagement weights (α, β, γ, δ)
  engagementWeights: {
    mentions: number;    // α: New posts/mentions count
    likes: number;       // β: Total likes
    shares: number;      // γ: Total shares/retweets  
    comments: number;    // δ: Total comments/replies
  };
  
  // Thresholds for status classification
  thresholds: {
    brewingGrowthRate: number;    // e.g., 0.5 (50% growth)
    surgingGrowthRate: number;    // e.g., 2.0 (200% growth)
    brewingZScore: number;        // e.g., 1.5
    surgingZScore: number;        // e.g., 2.5
  };
}

export class TDIEngine {
  private config: TDIConfig;
  private historicalData: Map<string, RawDataItem[]> = new Map();

  constructor(config: TDIConfig) {
    this.config = config;
  }

  /**
   * Calculate TDI for multiple symbols from raw data
   */
  async calculateTDI(rawData: RawDataItem[], trackedSymbols: string[]): Promise<TDIResult[]> {
    const results: TDIResult[] = [];
    const now = new Date();

    for (const symbol of trackedSymbols) {
      // Filter data relevant to this symbol
      const symbolData = this.filterDataBySymbol(rawData, symbol);
      
      // Store historical data
      this.updateHistoricalData(symbol, symbolData);
      
      // Calculate TDI for this symbol
      const tdiResult = await this.calculateSymbolTDI(symbol, symbolData, now);
      results.push(tdiResult);
    }

    // Sort by growth rate and z-score for surge detection
    results.sort((a, b) => {
      const scoreA = a.growthRate * 0.6 + a.zScore * 0.4;
      const scoreB = b.growthRate * 0.6 + b.zScore * 0.4;
      return scoreB - scoreA;
    });

    console.log(`📊 TDI calculated for ${results.length} symbols`);
    return results;
  }

  private async calculateSymbolTDI(
    symbol: string, 
    symbolData: RawDataItem[], 
    now: Date
  ): Promise<TDIResult> {
    // Define time windows
    const currentWindowStart = new Date(now.getTime() - this.config.currentWindowMinutes * 60000);
    const baselineWindowStart = new Date(now.getTime() - this.config.baselineWindowHours * 3600000);

    // Split data into current and baseline windows
    const currentData = symbolData.filter(item => 
      item.timestamp >= currentWindowStart && item.timestamp <= now
    );
    
    const baselineData = symbolData.filter(item => 
      item.timestamp >= baselineWindowStart && item.timestamp < currentWindowStart
    );

    // Calculate TDI for current and baseline periods
    const currentTDI = this.calculatePeriodTDI(currentData);
    const baselineTDI = this.calculatePeriodTDI(baselineData);
    
    // Calculate growth metrics
    const growthRate = baselineTDI > 0 ? (currentTDI - baselineTDI) / baselineTDI : 0;
    const zScore = this.calculateZScore(currentTDI, symbol);
    
    // Determine status
    const status = this.determineStatus(growthRate, zScore);
    
    // Calculate confidence (based on data volume and consistency)
    const confidence = this.calculateConfidence(currentData, baselineData);
    
    // Breakdown by source
    const breakdownBySource = this.calculateSourceBreakdown(currentData);

    return {
      symbol,
      currentTDI,
      baselineTDI,
      growthRate,
      zScore,
      status,
      confidence,
      breakdownBySource,
      timeWindow: {
        start: currentWindowStart,
        end: now
      }
    };
  }

  private calculatePeriodTDI(data: RawDataItem[]): number {
    if (data.length === 0) return 0;

    let totalTDI = 0;
    const platformScores = new Map<string, number>();

    // Group by platform and calculate platform-specific TDI
    for (const item of data) {
      const platform = item.metadata.platform;
      const engagement = item.metadata.engagement || {};

      // Calculate weighted engagement score
      const engagementScore = 
        (this.config.engagementWeights.mentions * 1) + // Each post counts as 1 mention
        (this.config.engagementWeights.likes * (engagement.likes || 0)) +
        (this.config.engagementWeights.shares * (engagement.shares || 0)) +
        (this.config.engagementWeights.comments * (engagement.comments || 0));

      const currentScore = platformScores.get(platform) || 0;
      platformScores.set(platform, currentScore + engagementScore);
    }

    // Apply platform weights and sum up
    for (const [platform, score] of platformScores) {
      const weight = this.config.platformWeights.get(platform) || 1;
      totalTDI += score * weight;
    }

    return totalTDI;
  }

  private calculateZScore(currentTDI: number, symbol: string): number {
    const historical = this.historicalData.get(symbol) || [];
    if (historical.length < 10) return 0; // Need sufficient data for z-score

    // Calculate historical TDI values (in windows)
    const historicalTDIs: number[] = [];
    const windowSize = this.config.currentWindowMinutes * 60000;
    
    for (let i = 0; i < historical.length; i += Math.floor(historical.length / 10)) {
      const windowData = historical.slice(i, i + Math.floor(historical.length / 10));
      historicalTDIs.push(this.calculatePeriodTDI(windowData));
    }

    // Calculate mean and standard deviation
    const mean = historicalTDIs.reduce((sum, val) => sum + val, 0) / historicalTDIs.length;
    const variance = historicalTDIs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalTDIs.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (currentTDI - mean) / stdDev : 0;
  }

  private determineStatus(growthRate: number, zScore: number): TDIResult['status'] {
    const { thresholds } = this.config;

    if (growthRate >= thresholds.surgingGrowthRate || zScore >= thresholds.surgingZScore) {
      return 'surging';
    } else if (growthRate >= thresholds.brewingGrowthRate || zScore >= thresholds.brewingZScore) {
      return 'brewing';
    } else if (growthRate < -0.3) {
      return 'declining';
    } else if (growthRate > 0.1) {
      return 'peaked';
    } else {
      return 'silent';
    }
  }

  private calculateConfidence(currentData: RawDataItem[], baselineData: RawDataItem[]): number {
    // Confidence based on data volume and consistency
    const totalVolume = currentData.length + baselineData.length;
    const volumeScore = Math.min(totalVolume / 50, 1); // Max confidence at 50+ data points
    
    // Platform diversity (more platforms = higher confidence)
    const platforms = new Set([
      ...currentData.map(d => d.metadata.platform),
      ...baselineData.map(d => d.metadata.platform)
    ]);
    const diversityScore = Math.min(platforms.size / 3, 1); // Max confidence with 3+ platforms

    return (volumeScore * 0.7 + diversityScore * 0.3);
  }

  private calculateSourceBreakdown(data: RawDataItem[]): Map<string, number> {
    const breakdown = new Map<string, number>();
    
    for (const item of data) {
      const platform = item.metadata.platform;
      const tdi = this.calculatePeriodTDI([item]);
      const current = breakdown.get(platform) || 0;
      breakdown.set(platform, current + tdi);
    }

    return breakdown;
  }

  private filterDataBySymbol(data: RawDataItem[], symbol: string): RawDataItem[] {
    const symbolVariants = this.generateSymbolVariants(symbol);
    
    return data.filter(item => {
      const content = item.content.toLowerCase();
      const hashtags = item.metadata.hashtags?.map(h => h.toLowerCase()) || [];
      
      return symbolVariants.some(variant => 
        content.includes(variant.toLowerCase()) ||
        hashtags.some(tag => tag.includes(variant.toLowerCase()))
      );
    });
  }

  private generateSymbolVariants(symbol: string): string[] {
    const variants = [symbol];
    
    // Add $ prefix if not present
    if (!symbol.startsWith('$')) {
      variants.push('$' + symbol);
    }
    
    // Add # prefix for hashtag
    variants.push('#' + symbol.replace('$', ''));
    
    // Add common variations
    variants.push(symbol.toLowerCase());
    variants.push(symbol.toUpperCase());
    
    return variants;
  }

  private updateHistoricalData(symbol: string, newData: RawDataItem[]): void {
    const existing = this.historicalData.get(symbol) || [];
    const combined = [...existing, ...newData];
    
    // Keep only recent data (last 7 days)
    const cutoffTime = new Date(Date.now() - 7 * 24 * 3600000);
    const filtered = combined.filter(item => item.timestamp >= cutoffTime);
    
    this.historicalData.set(symbol, filtered);
  }
} 