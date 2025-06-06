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

// Sentiment data from various sources
// 来自各种来源的舆情数据
export interface SentimentData {
    // Source of the sentiment data
    // 舆情数据来源
    source: string;
    
    // Weight of this source in overall sentiment calculation
    // 该来源在整体舆情计算中的权重
    sourceWeight: number;
    
    // Sentiment score (-1 to 1)
    // 舆情分数（-1到1）
    score: number;
    
    // Timestamp of the sentiment data
    // 舆情数据的时间戳
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

// Signal evaluation input
// 信号评估输入
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

// Telegram mention data
// Telegram提及数据
export interface TelegramMention {
    // Message ID
    // 消息ID
    messageId: string;
    
    // Channel ID
    // 频道ID
    channelId: string;
    
    // Timestamp
    // 时间戳
    timestamp: number;
    
    // Message content
    // 消息内容
    content: string;
    
    // Additional metadata
    // 额外元数据
    metadata?: Record<string, any>;
}

// Trade data
// 交易数据
export interface TradeData {
    // Transaction hash
    // 交易哈希
    txHash: string;
    
    // Trade type (buy/sell)
    // 交易类型（买入/卖出）
    type: 'buy' | 'sell';
    
    // Amount
    // 数量
    amount: number;
    
    // Price
    // 价格
    price: number;
    
    // Timestamp
    // 时间戳
    timestamp: number;
    
    // Additional metadata
    // 额外元数据
    metadata?: Record<string, any>;
}

// Blacklist entry
// 黑名单条目
export interface BlacklistEntry {
    // Severity level
    // 严重程度
    severity: 'low' | 'medium' | 'high';
    
    // Age in days
    // 年龄（天）
    age: number;
    
    // Reason
    // 原因
    reason: string;
    
    // Additional metadata
    // 额外元数据
    metadata?: Record<string, any>;
} 