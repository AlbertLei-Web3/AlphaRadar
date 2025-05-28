/**
 * Sentiment Analysis Module
 * 情感分析模块
 * 
 * This module handles the sentiment analysis of news content using a rule-based approach.
 * 本模块使用基于规则的方法处理新闻内容的情感分析。
 * 
 * Features:
 * 特点：
 * - Customizable sentiment dictionary
 * - 可自定义的情感词典
 * - Weighted scoring system
 * - 加权评分系统
 * - Confidence calculation
 * - 置信度计算
 * - Aspect-based analysis
 * - 基于方面的分析
 */

import { SentimentAnalysis } from './types';

// 情感词典
export const SENTIMENT_DICTIONARY = {
  positive: {
    market: ['bullish', 'surge', 'growth', 'rally', 'uptrend'],
    technology: ['breakthrough', 'innovation', 'advancement', 'improvement'],
    business: ['success', 'profit', 'gain', 'revenue', 'partnership'],
    general: ['positive', 'good', 'excellent', 'promising', 'optimistic']
  },
  negative: {
    market: ['bearish', 'crash', 'decline', 'downtrend', 'correction'],
    risk: ['risk', 'concern', 'warning', 'threat', 'vulnerability'],
    business: ['loss', 'drop', 'decline', 'failure', 'bankruptcy'],
    general: ['negative', 'bad', 'poor', 'pessimistic', 'worrisome']
  },
  neutral: {
    update: ['update', 'report', 'announce', 'release'],
    status: ['ongoing', 'pending', 'underway', 'planned'],
    general: ['neutral', 'stable', 'unchanged', 'maintained']
  }
};

// 情感权重
export const SENTIMENT_WEIGHTS = {
  market: 1.2,
  technology: 1.0,
  business: 1.1,
  risk: 1.3,
  general: 0.8
};

/**
 * 情感分析器
 */
export class SentimentAnalyzer {
  private dictionary: typeof SENTIMENT_DICTIONARY;
  private weights: typeof SENTIMENT_WEIGHTS;

  constructor(
    dictionary = SENTIMENT_DICTIONARY,
    weights = SENTIMENT_WEIGHTS
  ) {
    this.dictionary = dictionary;
    this.weights = weights;
  }

  /**
   * 分析文本情感
   */
  public analyze(text: string): SentimentAnalysis {
    const words = text.toLowerCase().split(/\W+/);
    const aspects: { [key: string]: number } = {};
    let totalScore = 0;
    let totalWeight = 0;

    // 分析每个方面的情感
    Object.entries(this.dictionary).forEach(([category, words]) => {
      const categoryScore = this.analyzeCategory(words, text);
      aspects[category] = categoryScore;
      
      const weight = this.weights[category as keyof typeof SENTIMENT_WEIGHTS] || 1;
      totalScore += categoryScore * weight;
      totalWeight += weight;
    });

    // 计算最终得分
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // 计算置信度
    const confidence = this.calculateConfidence(words, aspects);

    return {
      score: Math.max(-1, Math.min(1, finalScore)),
      confidence,
      aspects
    };
  }

  /**
   * 分析特定类别的情感
   */
  private analyzeCategory(
    categoryWords: { [key: string]: string[] },
    text: string
  ): number {
    let score = 0;
    let count = 0;

    Object.entries(categoryWords).forEach(([type, words]) => {
      words.forEach(word => {
        if (text.toLowerCase().includes(word)) {
          score += type === 'positive' ? 0.2 : type === 'negative' ? -0.2 : 0;
          count++;
        }
      });
    });

    return count > 0 ? score / count : 0;
  }

  /**
   * 计算分析置信度
   */
  private calculateConfidence(
    words: string[],
    aspects: { [key: string]: number }
  ): number {
    const wordCount = words.length;
    const aspectCount = Object.keys(aspects).length;
    
    // 基于词数和情感分布计算置信度
    const wordConfidence = Math.min(1, wordCount / 100);
    const aspectConfidence = Math.min(1, aspectCount / 5);
    
    return (wordConfidence + aspectConfidence) / 2;
  }
} 