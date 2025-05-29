import { CleanedNewsItem } from './cleaner';

// Simple sentiment dictionary
const sentimentDict = {
  positive: ['bullish', 'growth', 'increase', 'positive', 'gain', 'profit'],
  negative: ['bearish', 'decline', 'decrease', 'negative', 'loss', 'risk'],
  neutral: ['stable', 'maintain', 'unchanged', 'neutral']
};

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  keywords: string[];
}

export function analyzeSentiment(item: CleanedNewsItem): SentimentResult {
  const text = item.cleanedContent.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];

  // Count sentiment words
  Object.entries(sentimentDict).forEach(([sentiment, words]) => {
    words.forEach(word => {
      if (text.includes(word)) {
        if (sentiment === 'positive') positiveCount++;
        if (sentiment === 'negative') negativeCount++;
        foundKeywords.push(word);
      }
    });
  });

  // Calculate sentiment
  const total = positiveCount + negativeCount;
  const score = total === 0 ? 0 : (positiveCount - negativeCount) / total;

  return {
    sentiment: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
    score,
    keywords: foundKeywords
  };
} 