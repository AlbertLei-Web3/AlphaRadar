import { fetchNews } from '../modules/crawler';

async function testCrawler() {
  // Test with a real crypto news RSS feed
  const testUrl = 'https://cointelegraph.com/rss';
  
  console.log('Testing crawler with URL:', testUrl);
  try {
    const news = await fetchNews(testUrl);
    console.log(`Successfully fetched ${news.length} news items`);
    console.log('Sample news item:', news[0]);
  } catch (error) {
    console.error('Crawler test failed:', error);
  }
}

// Run the test
testCrawler(); 