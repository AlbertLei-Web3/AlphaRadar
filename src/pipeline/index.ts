import { fetchNews } from '../modules/crawler';
import { cleanNewsItem } from '../modules/cleaner';
import { analyzeSentiment } from '../modules/sentiment';
import { sendNotification, NotificationConfig } from '../modules/notifier';

export async function processNewsFeed(
  feedUrl: string,
  notificationConfig: NotificationConfig
) {
  try {
    // 1. Fetch news
    const newsItems = await fetchNews(feedUrl);
    
    // 2. Process each news item
    for (const item of newsItems) {
      // Clean the content
      const cleanedItem = cleanNewsItem(item);
      
      // Analyze sentiment
      const sentiment = analyzeSentiment(cleanedItem);
      
      // Send notification
      await sendNotification(item, sentiment, notificationConfig);
    }
  } catch (error) {
    console.error('Error in news processing pipeline:', error);
  }
} 