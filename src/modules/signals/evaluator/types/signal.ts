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

// GMGN Signal types
// GMGN信号类型
export enum GMGNSignalType {
    // Community takeover signal
    // 社区接管信号
    CTO = 'CTO',
    
    // Update social info signal
    // 更新社交信息信号
    UPDATE_SOCIAL = 'UPDATE_SOCIAL',
    
    // PUMP social info update
    // PUMP社交信息更新
    PUMP_SOCIAL = 'PUMP_SOCIAL',
    
    // PUMP FDV surge
    // PUMP内盘代币快速飙升
    PUMP_FDV_SURGE = 'PUMP_FDV_SURGE',
    
    // Solana FDV surge
    // Solana代币快速飙升
    SOL_FDV_SURGE = 'SOL_FDV_SURGE',
    
    // Smart money FOMO
    // 聪明钱FOMO
    SMART_MONEY_FOMO = 'SMART_MONEY_FOMO',
    
    // KOL FOMO
    // KOL FOMO
    KOL_FOMO = 'KOL_FOMO',
    
    // Developer burn alert
    // 开发者烧币提醒
    DEV_BURN = 'DEV_BURN',
    
    // ATH price alert
    // 历史新高提醒
    ATH_PRICE = 'ATH_PRICE',
    
    // Heavy buy alert
    // 大单买入提醒
    HEAVY_BUY = 'HEAVY_BUY',
    
    // New token sniper
    // 新币狙击
    SNIPER_NEW = 'SNIPER_NEW'
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
    
    // Signal type if detected
    // 检测到的信号类型
    signalType?: GMGNSignalType;
    
    // Additional metadata
    // 额外元数据
    metadata: {
        type: string;
        // Signal-specific data
        // 信号特定数据
        signalData?: {
            // Price data for ATH signals
            // ATH信号的价格数据
            price?: number;
            
            // Volume data for heavy buy signals
            // 大单买入信号的成交量数据
            volume?: number;
            
            // Burn amount for burn signals
            // 烧币信号的烧毁数量
            burnAmount?: number;
            
            // FDV data for surge signals
            // 飙升信号的FDV数据
            fdv?: number;
            
            // Social media update status
            // 社交媒体更新状态
            socialUpdate?: {
                twitter?: boolean;
                telegram?: boolean;
                website?: boolean;
            };
        };
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