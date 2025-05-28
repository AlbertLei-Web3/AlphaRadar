import { AnalysisResult, ScoreResult } from './types';

/**
 * Calculates final score based on analysis results
 * TODO: Implement more sophisticated scoring algorithms and user preferences
 */
export async function calculateScore(analysis: AnalysisResult): Promise<ScoreResult> {
  // Convert sentiment from [-1, 1] to [0, 1]
  const normalizedSentiment = (analysis.sentiment + 1) / 2;
  
  // Calculate final score (0-100)
  const finalScore = Math.round(
    (normalizedSentiment * 0.4 + analysis.credibility * 0.6) * 100
  );

  return {
    ...analysis,
    finalScore,
    scoreFactors: {
      sentiment: normalizedSentiment,
      credibility: analysis.credibility,
    },
  };
} 