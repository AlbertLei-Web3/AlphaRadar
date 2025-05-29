import { cleanNewsItem } from '../modules/cleaner';
import { fetchNews } from '../modules/crawler';

async function testCleaner() {
  const testUrl = 'https://cointelegraph.com/rss';
  
  console.log('Testing cleaner with sample news...');
  try {
    // First fetch some news
    const news = await fetchNews(testUrl);
    if (news.length === 0) {
      throw new Error('No news items fetched');
    }

    // Test cleaning the first news item
    const cleanedItem = cleanNewsItem(news[0]);
    console.log('Original content:', news[0].content.substring(0, 200) + '...');
    console.log('Cleaned content:', cleanedItem.cleanedContent.substring(0, 200) + '...');
  } catch (error) {
    console.error('Cleaner test failed:', error);
  }
}

// Run the test
testCleaner(); 