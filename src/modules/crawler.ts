import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsItem {
  title: string;
  content: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function fetchNews(url: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || '',
      content: item.content || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      source: feed.title || url
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
} 