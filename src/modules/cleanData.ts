import { NewsItem } from './types';

/**
 * Cleans and formats news content
 * TODO: Add more sophisticated text cleaning and formatting
 */
export async function cleanData(newsItems: NewsItem[]): Promise<NewsItem[]> {
  return newsItems.map(item => ({
    ...item,
    content: cleanContent(item.content),
    title: cleanTitle(item.title),
  }));
}

function cleanContent(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
} 