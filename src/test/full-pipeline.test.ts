import { processNewsFeed } from '../pipeline';

async function testFullPipeline() {
  const testUrl = 'https://cointelegraph.com/rss';
  const testConfig = {
    telegram: {
      botToken: 'test-token',
      chatId: 'test-chat-id'
    }
  };
  
  console.log('Testing full pipeline...');
  try {
    await processNewsFeed(testUrl, testConfig);
    console.log('Full pipeline test completed');
  } catch (error) {
    console.error('Full pipeline test failed:', error);
  }
}

// Run the test
testFullPipeline(); 