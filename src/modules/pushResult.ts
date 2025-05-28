import { ScoreResult } from './types';

/**
 * Displays or pushes analysis results
 * TODO: Add support for WebSocket, email notifications, and custom UI components
 */
export async function pushResult(result: ScoreResult): Promise<void> {
  // For MVP, just console.log the results
  console.log('=== News Analysis Result ===');
  console.log(`Title: ${result.newsItem.title}`);
  console.log(`Source: ${result.newsItem.source}`);
  console.log(`Summary: ${result.summary}`);
  console.log(`Final Score: ${result.finalScore}/100`);
  console.log(`Sentiment: ${result.sentiment}`);
  console.log(`Credibility: ${result.credibility}`);
  console.log(`Tags: ${result.tags.join(', ')}`);
  console.log('==========================');
} 