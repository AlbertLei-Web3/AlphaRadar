import { NewsItem } from './crawler';
import { SentimentResult } from './sentiment';

export interface NotificationConfig {
  telegram?: {
    botToken: string;
    chatId: string;
  };
  email?: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    to: string;
  };
}

export async function sendNotification(
  newsItem: NewsItem,
  sentiment: SentimentResult,
  config: NotificationConfig
) {
  const message = formatMessage(newsItem, sentiment);
  
  // TODO: Implement actual notification sending
  console.log('Notification:', message);
  
  // Placeholder for actual implementation
  if (config.telegram) {
    // TODO: Implement Telegram notification
  }
  
  if (config.email) {
    // TODO: Implement email notification
  }
}

function formatMessage(newsItem: NewsItem, sentiment: SentimentResult): string {
  return `
Title: ${newsItem.title}
Source: ${newsItem.source}
Sentiment: ${sentiment.sentiment} (Score: ${sentiment.score.toFixed(2)})
Keywords: ${sentiment.keywords.join(', ')}
Link: ${newsItem.link}
  `.trim();
} 