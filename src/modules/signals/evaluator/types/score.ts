// Score Types Definition
// 评分类型定义

// Score components interface
// 评分组件接口
export interface ScoreComponents {
    heatScore: number;         // Emotional heat score based on TG mentions
    buyPressureScore: number;  // Buy pressure score based on on-chain trades
    blacklistPenalty: number;  // Blacklist penalty score (negative)
    resonanceScore: number;    // GMGN signal resonance score
}

// Signal types from GMGN
// GMGN信号类型
export enum SignalType {
    CTO = 'CTO',
    PUMP_DEX = 'PUMP_DEX',
    PUMP_FDV = 'PUMP_FDV',
    SOLANA_FDV = 'SOLANA_FDV',
    SMART_MONEY = 'SMART_MONEY',
    KOL_FOMO = 'KOL_FOMO',
    DEV_BURN = 'DEV_BURN',
    ATH_PRICE = 'ATH_PRICE',
    HEAVY_BOUGHT = 'HEAVY_BOUGHT',
    SNIPER_NEW = 'SNIPER_NEW'
}

// Evaluation result interface
// 评估结果接口
export interface EvaluationResult {
    totalScore: number;        // Total score (0-100)
    components: ScoreComponents; // Individual component scores
    confidence: number;        // Confidence level (0-1)
    timestamp: number;         // Evaluation timestamp
    reasons: string[];         // Reasons for the score
}

// Score thresholds
// 分数阈值
export const SCORE_THRESHOLDS = {
    REJECT: 30,               // Below this score, signal is rejected
    MANUAL_REVIEW: 60,        // Between this and REJECT, manual review needed
    AUTO_PROCESS: 60          // Above this score, auto-process
} as const;

// Time decay factor
// 时间衰减因子
export const TIME_DECAY_FACTOR = 0.1; // 10% decay per hour

// Age factor for blacklist penalty
// 黑名单惩罚的年龄因子
export const AGE_FACTOR = 0.05; // 5% increase per day 