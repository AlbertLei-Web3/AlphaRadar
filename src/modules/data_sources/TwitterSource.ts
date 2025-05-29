import { IDataSource, RawDataItem, DataSourceConfig, RateLimitInfo } from './DataSourceInterface';
import axios, { AxiosInstance } from 'axios';

export class TwitterSource implements IDataSource {
  name = 'twitter';
  platform = 'twitter';
  isEnabled = true;

  private axiosInstance: AxiosInstance | null = null;
  private bearerToken: string = '';
  private rateLimitInfo: RateLimitInfo = {
    remaining: 300,
    resetTime: new Date(),
    limit: 300
  };

  async initialize(config: DataSourceConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Twitter Bearer Token is required');
    }

    this.bearerToken = config.apiKey;
    this.axiosInstance = axios.create({
      baseURL: 'https://api.twitter.com/2',
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 30000
    });

    console.log('🐦 Twitter source initialized');
  }

  async fetchData(keywords: string[]): Promise<RawDataItem[]> {
    if (!this.axiosInstance) {
      throw new Error('Twitter source not initialized');
    }

    const rawData: RawDataItem[] = [];

    // Build query for MEME coin specific search
    const memeQuery = this.buildMemeQuery(keywords);
    
    try {
      const response = await this.axiosInstance.get('/tweets/search/recent', {
        params: {
          query: memeQuery,
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,context_annotations,entities',
          'user.fields': 'public_metrics,verified',
          'expansions': 'author_id'
        }
      });

      // Update rate limit info from headers
      this.updateRateLimit(response.headers);

      const tweets = response.data.data || [];
      const users = this.createUserMap(response.data.includes?.users || []);

      for (const tweet of tweets) {
        const user = users.get(tweet.author_id);
        
        rawData.push({
          id: `twitter_${tweet.id}`,
          content: tweet.text,
          timestamp: new Date(tweet.created_at),
          source: this.name,
          metadata: {
            platform: this.platform,
            author: user?.username,
            engagement: {
              likes: tweet.public_metrics?.like_count || 0,
              shares: tweet.public_metrics?.retweet_count || 0,
              comments: tweet.public_metrics?.reply_count || 0,
              views: tweet.public_metrics?.impression_count || 0
            },
            url: `https://twitter.com/${user?.username}/status/${tweet.id}`,
            hashtags: this.extractHashtags(tweet.entities?.hashtags || []),
            mentions: this.extractMentions(tweet.entities?.mentions || [])
          }
        });
      }

      console.log(`🐦 Fetched ${rawData.length} tweets for MEME keywords: ${keywords.join(', ')}`);
    } catch (error: any) {
      console.error('❌ Twitter API error:', error.response?.data || error.message);
      throw error;
    }

    return rawData;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.axiosInstance) return false;

    try {
      await this.axiosInstance.get('/tweets/search/recent', {
        params: { query: 'test', max_results: 10 }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    return this.rateLimitInfo;
  }

  private buildMemeQuery(keywords: string[]): string {
    // Build MEME coin specific query
    const memeKeywords = keywords.map(keyword => {
      // Handle both symbol and hashtag formats
      if (keyword.startsWith('$')) {
        return `"${keyword}" OR "#${keyword.substring(1)}"`;
      } else {
        return `"$${keyword}" OR "#${keyword}"`;
      }
    });

    // Add MEME coin context terms
    const contextTerms = [
      'memecoin', 'meme coin', 'to the moon', 'LFG', 'WAGMI', 'NGMI', 'FOMO',
      'rug pull', 'diamond hands', 'paper hands', 'hodl', 'degen'
    ];

    const contextQuery = contextTerms.map(term => `"${term}"`).join(' OR ');
    
    return `(${memeKeywords.join(' OR ')}) (${contextQuery}) -is:retweet lang:en`;
  }

  private createUserMap(users: any[]): Map<string, any> {
    const userMap = new Map();
    users.forEach(user => userMap.set(user.id, user));
    return userMap;
  }

  private extractHashtags(hashtags: any[]): string[] {
    return hashtags.map(tag => `#${tag.tag}`);
  }

  private extractMentions(mentions: any[]): string[] {
    return mentions.map(mention => `@${mention.username}`);
  }

  private updateRateLimit(headers: any): void {
    this.rateLimitInfo = {
      remaining: parseInt(headers['x-rate-limit-remaining'] || '0'),
      resetTime: new Date(parseInt(headers['x-rate-limit-reset'] || '0') * 1000),
      limit: parseInt(headers['x-rate-limit-limit'] || '300')
    };
  }
} 