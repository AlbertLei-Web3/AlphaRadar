import Parser from 'rss-parser';
import { NewsItem } from './types';

const parser = new Parser();

/**
 * Fetches news from configured RSS feeds
 * TODO: Add support for Twitter, Discord, and other sources
 */
export async function fetchNews(): Promise<NewsItem[]> {
  try {
    // TODO: Move to config file
    const feeds = [
      'https://cointelegraph.com/rss',
      'https://decrypt.co/feed',
      // Add more feeds here
    ];

    const newsItems: NewsItem[] = [];

    for (const feed of feeds) {
      const feedData = await parser.parseURL(feed);
      
      feedData.items.forEach(item => {
        if (item.title && item.content) {
          newsItems.push({
            id: item.guid || item.link || Math.random().toString(),
            title: item.title,
            content: item.content,
            source: feedData.title || 'Unknown Source',
            url: item.link || '',
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          });
        }
      });
    }

    return newsItems;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
} 