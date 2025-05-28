import { fetchNews } from '../modules/fetchNews';
import { cleanData } from '../modules/cleanData';
import { analyzeWithAI } from '../modules/analyzeWithAI';
import { calculateScore } from '../modules/scoreEngine';
import { pushResult } from '../modules/pushResult';

/**
 * Main pipeline that orchestrates the entire analysis process
 * TODO: Add error handling, retries, and parallel processing
 */
export async function runAnalysis(): Promise<void> {
  try {
    // 1. Fetch news
    console.log('Fetching news...');
    const newsItems = await fetchNews();
    
    // 2. Clean data
    console.log('Cleaning data...');
    const cleanedNews = await cleanData(newsItems);
    
    // 3. Process each news item
    for (const newsItem of cleanedNews) {
      // 4. Analyze with AI
      console.log(`Analyzing: ${newsItem.title}`);
      const analysis = await analyzeWithAI(newsItem);
      
      // 5. Calculate score
      const scoredResult = await calculateScore(analysis);
      
      // 6. Push result
      await pushResult(scoredResult);
    }
    
    console.log('Analysis pipeline completed successfully!');
  } catch (error) {
    console.error('Error in analysis pipeline:', error);
  }
} 