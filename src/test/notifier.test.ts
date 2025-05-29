import { sendNotification } from '../modules/notifier';
import { analyzeSentiment } from '../modules/sentiment';
import { cleanNewsItem } from '../modules/cleaner';
import { fetchNews } from '../modules/crawler';

async function testNotifier() {
  const testUrl = 'https://cointelegraph.com/rss';
  
  console.log('Testing notifier...');
  try {
    // Fetch, clean, and analyze a news item
    const news = await fetchNews(testUrl);
    if (news.length === 0) {
      throw new Error('No news items fetched');
    }
    
    const cleanedItem = cleanNewsItem(news[0]);
    const sentiment = analyzeSentiment(cleanedItem);
    
    // Test notification with console output only
    const testConfig = {
      telegram: {
        botToken: 'test-token',
        chatId: 'test-chat-id'
      }
    };
    
    await sendNotification(news[0], sentiment, testConfig);
    console.log('Notification test completed');
  } catch (error) {
    console.error('Notifier test failed:', error);
  }
}

// Run the test
testNotifier(); 