export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
}

export interface AnalysisResult {
  newsItem: NewsItem;
  sentiment: number; // -1 to 1
  credibility: number; // 0 to 1
  summary: string;
  tags: string[];
}

export interface ScoreResult extends AnalysisResult {
  finalScore: number; // 0 to 100
  scoreFactors: {
    sentiment: number;
    credibility: number;
    // TODO: Add more scoring factors in the future
  };
} 