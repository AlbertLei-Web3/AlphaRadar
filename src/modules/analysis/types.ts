/**
 * Analysis Module Types
 * 分析模块类型定义
 * 
 * This file defines all the interfaces and types used in the analysis module.
 * 本文件定义了分析模块中使用的所有接口和类型。
 * 
 * The analysis module is designed to be modular and extensible, allowing for
 * different types of analysis (sentiment, credibility, etc.) to be added or
 * modified independently.
 * 分析模块设计为模块化和可扩展的，允许独立添加或修改不同类型的分析（情感、可信度等）。
 */

// 新闻项接口
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
}

// 分析结果接口
export interface AnalysisResult {
  newsItem: NewsItem;
  sentiment: number;  // -1 to 1
  credibility: number;  // 0 to 1
  summary: string;
  tags: string[];
  finalScore: number;  // 0 to 100
  metadata: AnalysisMetadata;
}

// 分析元数据
export interface AnalysisMetadata {
  confidence: number;  // 分析置信度
  processingTime: number;  // 处理时间
  analysisVersion: string;  // 分析版本
  analysisMethod: string;  // 分析方法
}

// 情感分析结果
export interface SentimentAnalysis {
  score: number;  // -1 to 1
  confidence: number;  // 0 to 1
  aspects: {
    [key: string]: number;  // 不同方面的情感得分
  };
}

// 可信度分析结果
export interface CredibilityAnalysis {
  score: number;  // 0 to 1
  factors: {
    source: number;  // 来源可信度
    content: number;  // 内容可信度
    consistency: number;  // 一致性
  };
}

// 关键词分析结果
export interface KeywordAnalysis {
  keywords: string[];
  weights: { [key: string]: number };
  categories: string[];
}

// 摘要生成结果
export interface SummaryAnalysis {
  summary: string;
  keyPoints: string[];
  length: number;
} 