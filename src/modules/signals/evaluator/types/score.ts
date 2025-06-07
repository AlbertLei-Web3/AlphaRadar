// Score Types Definition
// 评分类型定义

// Score components interface
// 评分组件接口
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
    // Total score (0-100)
    // 总分（0-100）
    totalScore: number;
    
    // Individual score components
    // 各个分数组件
    components: ScoreComponents;
    
    // Confidence level (0-1)
    // 置信度（0-1）
    confidence: number;
    
    // Timestamp of evaluation
    // 评估时间戳
    timestamp: number;
    
    // Reasons for the score
    // 分数原因
    reasons: string[];
}

// Score thresholds
// 分数阈值
export const SCORE_THRESHOLDS = {
    // Minimum score for a valid signal
    // 有效信号的最低分数
    MIN_VALID_SCORE: 50,
    
    // High confidence threshold
    // 高置信度阈值
    HIGH_CONFIDENCE: 0.8,
    
    // Medium confidence threshold
    // 中等置信度阈值
    MEDIUM_CONFIDENCE: 0.5
};

// Time decay factor for sentiment scores
// 舆情分数的时间衰减因子
export const TIME_DECAY_FACTOR = 0.1;

// Age factor for blacklist penalties
// 黑名单惩罚的年龄因子
export const AGE_FACTOR = 0.05;

// Score calculation functions
// 分数计算函数

import { GMGNSignalType } from './signal';
import { SignalMention } from './signal';

// Calculate base score from mentions
// 从提及计算基础分数
export function calculateBaseScore(mentions: SignalMention[]): number {
    if (!mentions || mentions.length === 0) {
        return 0;
    }

    // Base score calculation formula
    // 基础分数计算公式
    const baseScore = Math.min(mentions.length * 10, 100);
    return baseScore;
}

// Calculate time decay factor
// 计算时间衰减因子
export function calculateTimeDecay(timestamp: number): number {
    const now = Date.now() / 1000;
    const age = now - timestamp;

    // No decay for future timestamps
    // 未来时间戳不衰减
    if (age < 0) {
        return 1;
    }

    // Decay formula: 1 / (1 + age/3600)
    // 衰减公式：1 / (1 + age/3600)
    const decay = 1 / (1 + age / 3600);
    return Math.max(decay, 0.1); // Minimum decay of 0.1
}

// Calculate signal type multiplier
// 计算信号类型乘数
export function calculateSignalMultiplier(signalType?: GMGNSignalType): number {
    if (!signalType) {
        return 1;
    }

    // Signal type multipliers
    // 信号类型乘数
    const multipliers: Record<GMGNSignalType, number> = {
        [GMGNSignalType.CTO]: 2.0,
        [GMGNSignalType.UPDATE_SOCIAL]: 1.5,
        [GMGNSignalType.PUMP_SOCIAL]: 1.8,
        [GMGNSignalType.PUMP_FDV_SURGE]: 1.7,
        [GMGNSignalType.SOL_FDV_SURGE]: 1.6,
        [GMGNSignalType.SMART_MONEY_FOMO]: 1.9,
        [GMGNSignalType.KOL_FOMO]: 1.8,
        [GMGNSignalType.DEV_BURN]: 1.7,
        [GMGNSignalType.ATH_PRICE]: 1.6,
        [GMGNSignalType.HEAVY_BUY]: 1.5,
        [GMGNSignalType.SNIPER_NEW]: 1.4
    };

    return multipliers[signalType] || 1;
}

// Calculate final score
// 计算最终分数
export function calculateFinalScore(
    baseScore: number,
    timeDecay: number,
    signalMultiplier: number
): number {
    return Math.min(Math.round(baseScore * timeDecay * signalMultiplier), 100);
} 