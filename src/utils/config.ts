export const config = {
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // RSS Feeds
  RSS_FEEDS: [
    'https://cointelegraph.com/rss',
    'https://decrypt.co/feed',
    // Add more feeds here
  ],
  
  // Analysis Settings
  ANALYSIS: {
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
  },
  
  // Scoring Weights
  SCORING: {
    SENTIMENT_WEIGHT: 0.4,
    CREDIBILITY_WEIGHT: 0.6,
  },
}; 