import { analyzeSentiment } from '../modules/sentiment';
import { cleanNewsItem } from '../modules/cleaner';
import { fetchNews } from '../modules/crawler';

async function testSentiment() {
  const testUrl = 'https://cointelegraph.com/rss';
  
  console.log('Testing sentiment analyzer...');
  try {
    // Fetch and clean a news item
    const news = await fetchNews(testUrl);
    if (news.length === 0) {
      throw new Error('No news items fetched');
    }
    
    const cleanedItem = cleanNewsItem(news[0]);
    
    // Analyze sentiment
    const sentiment = analyzeSentiment(cleanedItem);
    console.log('Sentiment analysis result:', {
      sentiment: sentiment.sentiment,
      score: sentiment.score,
      keywords: sentiment.keywords
    });
  } catch (error) {
    console.error('Sentiment test failed:', error);
  }
}

// Run the test
testSentiment(); 