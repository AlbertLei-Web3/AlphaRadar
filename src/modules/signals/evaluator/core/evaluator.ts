// Signal Evaluator Core
// 信号评估器核心 （雷某接下来需要重点关注人力该规则的部分）

import { 
    ScoreComponents, 
    EvaluationResult, 
    SCORE_THRESHOLDS,
    SignalType 
} from '../types/score';
import { 
    SignalEvaluationInput, 
    TelegramMention, 
    TradeData, 
    BlacklistEntry 
} from '../types/signal';

// Heat score calculation
// 热度评分计算
function calcHeatScore(mentions: TelegramMention[]): number {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour ago
    const twoHoursAgo = now - 7200000; // 2 hours ago

    // Calculate mentions in last hour and previous hour
    // 计算最近一小时和前一小时的提及次数
    const currentHourMentions = mentions.filter(m => m.timestamp >= oneHourAgo).length;
    const previousHourMentions = mentions.filter(m => 
        m.timestamp >= twoHoursAgo && m.timestamp < oneHourAgo
    ).length;

    // Calculate growth rate
    // 计算增长率
    const growthRate = previousHourMentions === 0 ? 0 : 
        (currentHourMentions - previousHourMentions) / previousHourMentions;

    // Score based on growth rate
    // 基于增长率评分
    if (growthRate >= 0.5) { // 50% growth
        return 40;
    } else if (growthRate >= 0.3) { // 30% growth
        return 30;
    } else if (growthRate >= 0.1) { // 10% growth
        return 20;
    }
    return 0;
}

// Buy pressure score calculation
// 买入压力评分计算
function calcBuyPressureScore(trades: TradeData[]): number {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000; // 5 minutes ago

    // Count buy trades in last 5 minutes
    // 计算最近5分钟的买入交易数
    const recentBuys = trades.filter(t => 
        t.timestamp >= fiveMinutesAgo && 
        t.type === 'buy'
    ).length;

    // Score based on buy count
    // 基于买入数量评分
    if (recentBuys >= 10) {
        return 30;
    } else if (recentBuys >= 5) {
        return 20;
    } else if (recentBuys >= 3) {
        return 10;
    }
    return 0;
}

// Blacklist penalty calculation
// 黑名单惩罚计算
function calcBlacklistPenalty(blacklistStatus?: BlacklistEntry): number {
    if (!blacklistStatus) return 0;

    // Base penalty based on severity
    // 基于严重程度的基础惩罚
    const basePenalty = {
        'low': -5,
        'medium': -10,
        'high': -20
    }[blacklistStatus.severity];

    // Apply age factor
    // 应用年龄因子
    const ageFactor = 1 + (blacklistStatus.age * 0.05); // 5% increase per day
    return basePenalty * ageFactor;
}

// Resonance score calculation
// 共振评分计算
function calcResonanceScore(triggeredSignals: SignalType[]): number {
    const uniqueSignals = new Set(triggeredSignals).size;
    
    // Score based on number of unique signals
    // 基于唯一信号数量评分
    if (uniqueSignals >= 4) {
        return 30;
    } else if (uniqueSignals >= 2) {
        return 20;
    } else if (uniqueSignals === 1) {
        return 10;
    }
    return 0;
}

// Main evaluator class
// 主评估器类
export class SignalEvaluator {
    // Evaluate a signal
    // 评估信号
    async evaluate(input: SignalEvaluationInput): Promise<EvaluationResult> {
        // Calculate component scores
        // 计算组件分数
        const components: ScoreComponents = {
            heatScore: calcHeatScore(input.telegramMentions),
            buyPressureScore: calcBuyPressureScore(input.trades),
            blacklistPenalty: calcBlacklistPenalty(input.blacklistStatus),
            resonanceScore: calcResonanceScore(input.triggeredSignals)
        };

        // Calculate total score
        // 计算总分
        const totalScore = Math.min(100, 
            components.heatScore + 
            components.buyPressureScore + 
            components.blacklistPenalty + 
            components.resonanceScore
        );

        // Calculate confidence level
        // 计算置信度
        const confidence = this.calculateConfidence(components);

        // Generate reasons
        // 生成分数原因
        const reasons = this.generateReasons(components);

        return {
            totalScore,
            components,
            confidence,
            timestamp: Date.now(),
            reasons
        };
    }

    // Calculate confidence level
    // 计算置信度
    private calculateConfidence(components: ScoreComponents): number {
        // Simple confidence calculation based on component scores
        // 基于组件分数的简单置信度计算
        const maxPossibleScore = 40 + 30 + 30; // Max scores for heat, buy pressure, and resonance
        const actualScore = components.heatScore + components.buyPressureScore + components.resonanceScore;
        return Math.min(1, actualScore / maxPossibleScore);
    }

    // Generate reasons for the score
    // 生成分数原因
    private generateReasons(components: ScoreComponents): string[] {
        const reasons: string[] = [];

        if (components.heatScore > 0) {
            reasons.push(`Heat score: ${components.heatScore} (TG mentions growth)`);
        }
        if (components.buyPressureScore > 0) {
            reasons.push(`Buy pressure: ${components.buyPressureScore} (recent buy trades)`);
        }
        if (components.blacklistPenalty < 0) {
            reasons.push(`Blacklist penalty: ${components.blacklistPenalty} (token in blacklist)`);
        }
        if (components.resonanceScore > 0) {
            reasons.push(`Signal resonance: ${components.resonanceScore} (multiple GMGN signals)`);
        }

        return reasons;
    }
} 