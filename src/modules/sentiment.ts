import OpenAI from 'openai';
import { RawDataItem } from './data_sources/DataSourceInterface';

export interface MemeSentimentResult {
  sentiment: 'extremely_bullish' | 'bullish' | 'neutral' | 'bearish' | 'extremely_bearish' | 'fomo' | 'fud';
  confidence: number; // 0.0 to 1.0
  keywords: string[];
  quotes: string[];
  emotionalIntensity: number; // 0.0 to 1.0
  risk_signals: string[]; // e.g., "rug pull", "exit scam"
}

export interface SentimentBatch {
  results: Map<string, MemeSentimentResult>;
  aggregatedSentiment: {
    dominant: MemeSentimentResult['sentiment'];
    distribution: Map<MemeSentimentResult['sentiment'], number>;
    averageConfidence: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class MemeSentimentAnalyzer {
  private openai: OpenAI;
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  /**
   * Analyze sentiment for a batch of raw data items
   */
  async analyzeBatch(data: RawDataItem[], symbol?: string): Promise<SentimentBatch> {
    const results = new Map<string, MemeSentimentResult>();
    
    // Process in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          await this.respectRateLimit();
          const sentiment = await this.analyzeSingleItem(item, symbol);
          return { id: item.id, sentiment };
        } catch (error) {
          console.error(`❌ Sentiment analysis failed for ${item.id}:`, error);
          return { 
            id: item.id, 
            sentiment: this.getFallbackSentiment(item.content) 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.set(result.value.id, result.value.sentiment);
        }
      });
    }

    // Calculate aggregated sentiment
    const aggregated = this.calculateAggregatedSentiment(results);

    console.log(`🧠 Analyzed sentiment for ${results.size} items. Dominant: ${aggregated.dominant}`);

    return {
      results,
      aggregatedSentiment: aggregated
    };
  }

  /**
   * Analyze sentiment for a single data item using GPT
   */
  private async analyzeSingleItem(item: RawDataItem, symbol?: string): Promise<MemeSentimentResult> {
    const systemPrompt = this.buildSystemPrompt(symbol);
    const userContent = this.buildUserPrompt(item);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from GPT');
    }

    try {
      const parsed = JSON.parse(content) as MemeSentimentResult;
      
      // Validate the response
      this.validateSentimentResult(parsed);
      
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse GPT sentiment response:', content);
      throw error;
    }
  }

  private buildSystemPrompt(symbol?: string): string {
    const basePrompt = `You are a specialized MEME cryptocurrency sentiment analysis engine. Your job is to analyze social media posts and determine market sentiment with focus on MEME coin trading psychology.

CRITICAL: You must respond with valid JSON in this exact format:
{
  "sentiment": "extremely_bullish|bullish|neutral|bearish|extremely_bearish|fomo|fud",
  "confidence": 0.85,
  "keywords": ["hodl", "moon", "diamond hands"],
  "quotes": ["key phrases from text"],
  "emotionalIntensity": 0.75,
  "risk_signals": ["rug pull", "exit scam"]
}

SENTIMENT DEFINITIONS:
- extremely_bullish: Explosive optimism, massive hype, "to the moon" energy
- bullish: Positive outlook, buying interest, growth expectations  
- fomo: Fear of missing out, urgent buying pressure, FOMO psychology
- neutral: Balanced or informational, no clear bias
- bearish: Negative outlook, selling pressure, price concerns
- extremely_bearish: Panic, crash fears, extreme negativity
- fud: Fear, uncertainty, doubt - deliberate negative sentiment

KEY MEME INDICATORS:
- Bullish: "moon", "lambo", "diamond hands", "hodl", "LFG", "WAGMI", "ape in"
- FOMO: "buy now", "last chance", "going parabolic", "don't miss out"  
- Bearish: "dump", "sell", "overvalued", "bubble", "correction"
- FUD: "rug pull", "scam", "exit scam", "worthless", "dead coin"
- Risk signals: "rug", "scam", "dump", "whale selling", "team selling"

Consider context, sarcasm, and crypto slang. Weight recent engagement metrics.`;

    if (symbol) {
      return basePrompt + `\n\nFOCUS: Pay special attention to mentions of ${symbol} and related discussion.`;
    }

    return basePrompt;
  }

  private buildUserPrompt(item: RawDataItem): string {
    const engagement = item.metadata.engagement || {};
    
    return `Analyze this ${item.metadata.platform} post:

TEXT: "${item.content}"

METADATA:
- Platform: ${item.metadata.platform}
- Author: ${item.metadata.author || 'unknown'}
- Likes: ${engagement.likes || 0}
- Shares: ${engagement.shares || 0}  
- Comments: ${engagement.comments || 0}
- Hashtags: ${item.metadata.hashtags?.join(', ') || 'none'}
- Posted: ${item.timestamp.toISOString()}

Analyze the sentiment focusing on MEME coin trading psychology and market implications.`;
  }

  private validateSentimentResult(result: any): asserts result is MemeSentimentResult {
    const validSentiments = [
      'extremely_bullish', 'bullish', 'neutral', 'bearish', 
      'extremely_bearish', 'fomo', 'fud'
    ];

    if (!validSentiments.includes(result.sentiment)) {
      throw new Error(`Invalid sentiment: ${result.sentiment}`);
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error(`Invalid confidence: ${result.confidence}`);
    }

    if (!Array.isArray(result.keywords)) {
      result.keywords = [];
    }

    if (!Array.isArray(result.quotes)) {
      result.quotes = [];
    }

    if (!Array.isArray(result.risk_signals)) {
      result.risk_signals = [];
    }

    if (typeof result.emotionalIntensity !== 'number') {
      result.emotionalIntensity = 0.5;
    }
  }

  private getFallbackSentiment(content: string): MemeSentimentResult {
    // Simple fallback for when GPT fails
    const text = content.toLowerCase();
    
    if (text.includes('moon') || text.includes('lambo') || text.includes('diamond')) {
      return {
        sentiment: 'bullish',
        confidence: 0.3,
        keywords: ['fallback'],
        quotes: [],
        emotionalIntensity: 0.5,
        risk_signals: []
      };
    }

    return {
      sentiment: 'neutral',
      confidence: 0.2,
      keywords: ['fallback'],
      quotes: [],
      emotionalIntensity: 0.3,
      risk_signals: []
    };
  }

  private calculateAggregatedSentiment(results: Map<string, MemeSentimentResult>) {
    const distribution = new Map<MemeSentimentResult['sentiment'], number>();
    let totalConfidence = 0;
    let riskSignalCount = 0;

    // Count sentiment distribution and calculate averages
    for (const result of results.values()) {
      const current = distribution.get(result.sentiment) || 0;
      distribution.set(result.sentiment, current + 1);
      totalConfidence += result.confidence;
      riskSignalCount += result.risk_signals.length;
    }

    // Find dominant sentiment
    let dominant: MemeSentimentResult['sentiment'] = 'neutral';
    let maxCount = 0;
    for (const [sentiment, count] of distribution) {
      if (count > maxCount) {
        maxCount = count;
        dominant = sentiment;
      }
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(distribution, riskSignalCount, results.size);

    return {
      dominant,
      distribution,
      averageConfidence: results.size > 0 ? totalConfidence / results.size : 0,
      riskLevel
    };
  }

  private calculateRiskLevel(
    distribution: Map<MemeSentimentResult['sentiment'], number>,
    riskSignalCount: number,
    totalItems: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskSignalRatio = riskSignalCount / totalItems;
    const bearishRatio = ((distribution.get('bearish') || 0) + (distribution.get('extremely_bearish') || 0) + (distribution.get('fud') || 0)) / totalItems;

    if (riskSignalRatio > 0.3 || bearishRatio > 0.6) return 'critical';
    if (riskSignalRatio > 0.15 || bearishRatio > 0.4) return 'high';
    if (riskSignalRatio > 0.05 || bearishRatio > 0.2) return 'medium';
    return 'low';
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
} 