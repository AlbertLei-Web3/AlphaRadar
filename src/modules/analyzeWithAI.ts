import OpenAI from 'openai';
import { NewsItem, AnalysisResult } from './types';

// TODO: Move to config file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes news content using OpenAI API
 * TODO: Add support for multiple AI models and custom analysis rules
 */
export async function analyzeWithAI(newsItem: NewsItem): Promise<AnalysisResult> {
  try {
    const prompt = `
      Analyze this crypto news article and provide:
      1. A sentiment score (-1 to 1)
      2. A credibility score (0 to 1)
      3. A brief summary
      4. Relevant tags

      Title: ${newsItem.title}
      Content: ${newsItem.content}
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const response = completion.choices[0].message.content;
    const analysis = parseAIResponse(response || '');

    return {
      newsItem,
      ...analysis,
    };
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    return {
      newsItem,
      sentiment: 0,
      credibility: 0.5,
      summary: 'Analysis failed',
      tags: ['error'],
    };
  }
}

function parseAIResponse(response: string): Omit<AnalysisResult, 'newsItem'> {
  // TODO: Implement proper response parsing
  return {
    sentiment: 0,
    credibility: 0.5,
    summary: response,
    tags: ['crypto'],
  };
} 