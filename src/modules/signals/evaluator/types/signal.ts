// Signal types and interfaces
// 信号类型和接口

// Signal type
// 信号类型
export enum SignalType {
    // Technical analysis signals
    // 技术分析信号
    TECHNICAL = 'TECHNICAL',
    
    // Fundamental analysis signals
    // 基本面分析信号
    FUNDAMENTAL = 'FUNDAMENTAL',
    
    // Social sentiment signals
    // 社交情绪信号
    SOCIAL = 'SOCIAL',
    
    // Market trend signals
    // 市场趋势信号
    MARKET = 'MARKET',
    
    // Custom signals
    // 自定义信号
    CUSTOM = 'CUSTOM'
}

// Telegram mention interface
// Telegram提及接口
export interface TelegramMention {
    // Symbol being mentioned
    // 被提及的符号
    symbol: string;
    
    // Timestamp of mention
    // 提及时间戳
    timestamp: number;
    
    // Source of mention
    // 提及来源
    source: string;
    
    // Original message content
    // 原始消息内容
    content: string;
    
    // Additional metadata
    // 额外元数据
    metadata: {
        type: string;
        [key: string]: any;
    };
}

// Sentiment data interface
// 舆情数据接口
export interface SentimentData {
    // Symbol being analyzed
    // 被分析的符号
    symbol: string;
    
    // Sentiment score (0-100)
    // 舆情分数（0-100）
    score: number;
    
    // Source weight in overall sentiment calculation
    // 在整体舆情计算中的来源权重
    sourceWeight: number;
    
    // Timestamp of analysis
    // 分析时间戳
    timestamp: number;
    
    // Data source
    // 数据来源
    source: string;
    
    // Additional metadata
    // 额外元数据
    metadata: {
        [key: string]: any;
    };
}

// Signal evaluation input interface
// 信号评估输入接口
export interface SignalEvaluationInput {
    // Signal to evaluate
    // 要评估的信号
    signal: {
        tokenAddress: string;
        [key: string]: any;
    };
    
    // Telegram mentions
    // Telegram提及
    telegramMentions: TelegramMention[];
    
    // Recent trades
    // 最近的交易
    trades: TradeData[];
    
    // Triggered signals
    // 触发的信号
    triggeredSignals: SignalType[];
    
    // Blacklist status
    // 黑名单状态
    blacklistStatus?: BlacklistEntry;
}

// Trade data interface
// 交易数据接口
export interface TradeData {
    // Symbol
    // 符号
    symbol: string;
    
    // Price
    // 价格
    price: number;
    
    // Volume
    // 成交量
    volume: number;
    
    // Trade type (buy/sell)
    // 交易类型（买入/卖出）
    type: 'buy' | 'sell';
    
    // Amount
    // 数量
    amount: number;
    
    // Timestamp
    // 时间戳
    timestamp: number;
    
    // Additional metadata
    // 额外元数据
    metadata?: Record<string, any>;
}

// Blacklist entry interface
// 黑名单条目接口
export interface BlacklistEntry {
    // Symbol
    // 符号
    symbol: string;
    
    // Severity level
    // 严重程度
    severity: 'high' | 'medium' | 'low';
    
    // Age in days
    // 年龄（天）
    age: number;
    
    // Reason
    // 原因
    reason: string;
    
    // Timestamp
    // 时间戳
    timestamp: number;
    
    // Additional metadata
    // 额外元数据
    metadata?: Record<string, any>;
}

// Score components for signal evaluation
// 信号评估的分数组件
export interface ScoreComponents {
    // Sentiment score from multiple sources
    // 来自多个来源的舆情分数
    sentimentScore: number;
    
    // Buy pressure score
    // 买入压力分数
    buyPressureScore: number;
    
    // Blacklist penalty
    // 黑名单惩罚
    blacklistPenalty: number;
    
    // Resonance score
    // 共振分数
    resonanceScore: number;
} 