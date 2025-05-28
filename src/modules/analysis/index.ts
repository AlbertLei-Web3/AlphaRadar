/**
 * News Analysis Module
 * 新闻分析模块
 * 
 * This is the main analysis module that orchestrates the entire analysis process.
 * 这是协调整个分析过程的主分析模块。
 * 
 * Features:
 * 特点：
 * - Parallel analysis execution
 * - 并行分析执行
 * - Comprehensive scoring system
 * - 综合评分系统
 * - Error handling and recovery
 * - 错误处理和恢复
 * - Performance monitoring
 * - 性能监控
 * 
 * The module combines results from various analyzers to provide
 * a complete analysis of news content.
 * 该模块结合了各种分析器的结果，提供新闻内容的完整分析。
 */

import { NewsItem, AnalysisResult, AnalysisMetadata } from './types';
import { SentimentAnalyzer } from './sentiment';
import { CredibilityAnalyzer } from './credibility';

/**
 * 新闻分析器
 */
export class NewsAnalyzer {
  private sentimentAnalyzer: SentimentAnalyzer;
  private credibilityAnalyzer: CredibilityAnalyzer;
  private version: string = '1.0.0';

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.credibilityAnalyzer = new CredibilityAnalyzer();
  }

  /**
   * 分析新闻
   */
  public async analyze(newsItem: NewsItem): Promise<AnalysisResult> {
    const startTime = Date.now();
    const text = `${newsItem.title} ${newsItem.content}`;

    try {
      // 并行执行分析
      const [sentimentResult, credibilityResult] = await Promise.all([
        this.sentimentAnalyzer.analyze(text),
        this.credibilityAnalyzer.analyze(text)
      ]);

      // 生成摘要
      const summary = this.generateSummary(text);

      // 提取标签
      const tags = this.extractTags(text);

      // 计算最终分数
      const finalScore = this.calculateFinalScore(sentimentResult, credibilityResult);

      // 计算处理时间
      const processingTime = Date.now() - startTime;

      return {
        newsItem,
        sentiment: sentimentResult.score,
        credibility: credibilityResult.score,
        summary,
        tags,
        finalScore,
        metadata: {
          confidence: (sentimentResult.confidence + credibilityResult.score) / 2,
          processingTime,
          analysisVersion: this.version,
          analysisMethod: 'rule-based'
        }
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return this.createErrorResult(newsItem, startTime);
    }
  }

  /**
   * 生成摘要
   */
  private generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/);
    if (sentences.length === 0) return text;
    return sentences[0].trim();
  }

  /**
   * 提取标签
   */
  private extractTags(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const uniqueWords = Array.from(new Set(words));
    return uniqueWords
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  /**
   * 计算最终分数
   */
  private calculateFinalScore(
    sentiment: { score: number; confidence: number },
    credibility: { score: number }
  ): number {
    // 情感得分转换为0-50分
    const sentimentScore = ((sentiment.score + 1) / 2) * 50;
    
    // 可信度得分转换为0-50分
    const credibilityScore = credibility.score * 50;
    
    // 加权平均
    return Math.round(sentimentScore * 0.6 + credibilityScore * 0.4);
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(newsItem: NewsItem, startTime: number): AnalysisResult {
    return {
      newsItem,
      sentiment: 0,
      credibility: 0.5,
      summary: 'Analysis failed',
      tags: ['error'],
      finalScore: 50,
      metadata: {
        confidence: 0,
        processingTime: Date.now() - startTime,
        analysisVersion: this.version,
        analysisMethod: 'error'
      }
    };
  }
} 