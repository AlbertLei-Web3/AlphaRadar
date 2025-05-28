/**
 * Credibility Analysis Module
 * 可信度分析模块
 * 
 * This module evaluates the credibility of news content based on various factors.
 * 本模块基于各种因素评估新闻内容的可信度。
 * 
 * Features:
 * 特点：
 * - Source credibility assessment
 * - 来源可信度评估
 * - Content quality analysis
 * - 内容质量分析
 * - Consistency checking
 * - 一致性检查
 * - Weighted scoring system
 * - 加权评分系统
 */

import { CredibilityAnalysis } from './types';

// 可信度规则
export const CREDIBILITY_RULES = {
  source: {
    high: ['official', 'announcement', 'report', 'study', 'research', 'verified'],
    low: ['rumor', 'speculation', 'unconfirmed', 'allegedly', 'anonymous']
  },
  content: {
    high: ['evidence', 'data', 'statistics', 'analysis', 'research'],
    low: ['might', 'could', 'possibly', 'maybe', 'potentially']
  },
  consistency: {
    high: ['consistent', 'confirmed', 'verified', 'proven'],
    low: ['contradictory', 'inconsistent', 'disputed', 'controversial']
  }
};

// 可信度权重
export const CREDIBILITY_WEIGHTS = {
  source: 0.4,
  content: 0.4,
  consistency: 0.2
};

/**
 * 可信度分析器
 */
export class CredibilityAnalyzer {
  private rules: typeof CREDIBILITY_RULES;
  private weights: typeof CREDIBILITY_WEIGHTS;

  constructor(
    rules = CREDIBILITY_RULES,
    weights = CREDIBILITY_WEIGHTS
  ) {
    this.rules = rules;
    this.weights = weights;
  }

  /**
   * 分析文本可信度
   */
  public analyze(text: string): CredibilityAnalysis {
    const factors = {
      source: this.analyzeFactor('source', text),
      content: this.analyzeFactor('content', text),
      consistency: this.analyzeFactor('consistency', text)
    };

    // 计算加权平均分
    const score = Object.entries(factors).reduce((total, [factor, value]) => {
      return total + value * (this.weights[factor as keyof typeof CREDIBILITY_WEIGHTS] || 0);
    }, 0);

    return {
      score: Math.max(0, Math.min(1, score)),
      factors
    };
  }

  /**
   * 分析特定因素的可信度
   */
  private analyzeFactor(factor: keyof typeof CREDIBILITY_RULES, text: string): number {
    const factorRules = this.rules[factor];
    let score = 0.5; // 基础分
    let count = 0;

    // 检查高可信度词
    factorRules.high.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score += 0.1;
        count++;
      }
    });

    // 检查低可信度词
    factorRules.low.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score -= 0.1;
        count++;
      }
    });

    // 如果有匹配项，返回调整后的分数
    return count > 0 ? Math.max(0, Math.min(1, score)) : 0.5;
  }
} 