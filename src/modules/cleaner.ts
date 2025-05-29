import { NewsItem } from './crawler';

export interface CleanedNewsItem extends NewsItem {
  cleanedContent: string;
}

export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function cleanNewsItem(item: NewsItem): CleanedNewsItem {
  return {
    ...item,
    cleanedContent: cleanText(item.content)
  };
} 