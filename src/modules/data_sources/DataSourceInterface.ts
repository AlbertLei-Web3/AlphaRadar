export interface RawDataItem {
  id: string;
  content: string;
  timestamp: Date;
  source: string;
  metadata: {
    platform: string;
    author?: string;
    engagement?: {
      likes?: number;
      shares?: number;
      comments?: number;
      views?: number;
    };
    url?: string;
    hashtags?: string[];
    mentions?: string[];
  };
}

export interface IDataSource {
  name: string;
  platform: string;
  isEnabled: boolean;
  
  // Initialize the data source with configuration
  initialize(config: DataSourceConfig): Promise<void>;
  
  // Fetch data based on tracked keywords/symbols
  fetchData(keywords: string[]): Promise<RawDataItem[]>;
  
  // Health check for the data source
  healthCheck(): Promise<boolean>;
  
  // Get rate limit information
  getRateLimitInfo(): RateLimitInfo;
}

export interface DataSourceConfig {
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: number;
  retryAttempts?: number;
  timeout?: number;
  customParams?: Record<string, any>;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  limit: number;
} 