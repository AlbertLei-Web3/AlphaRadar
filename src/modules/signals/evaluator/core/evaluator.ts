// Signal Evaluator Core
// 信号评估器核心

import { 
    ScoreComponents, 
    EvaluationResult, 
    SCORE_THRESHOLDS,
    SignalType,
    TIME_DECAY_FACTOR,
    AGE_FACTOR
} from '../types/score';
import { 
    SignalEvaluationInput, 
    TelegramMention, 
    TradeData, 
    BlacklistEntry 
} from '../types/signal';
import { logger } from '../utils/logger';

// Scoring configuration
// 评分配置
interface ScoringConfig {
    heatScore: {
        thresholds: {
            high: number;    // e.g., 0.5 for 50% growth
            medium: number;  // e.g., 0.3 for 30% growth
            low: number;     // e.g., 0.1 for 10% growth
        };
        weights: {
            high: number;    // e.g., 40 points
            medium: number;  // e.g., 30 points
            low: number;     // e.g., 20 points
        };
        timeWindow: number;  // in milliseconds
    };
    buyPressure: {
        thresholds: {
            high: number;    // e.g., 10 trades
            medium: number;  // e.g., 5 trades
            low: number;     // e.g., 3 trades
        };
        weights: {
            high: number;    // e.g., 30 points
            medium: number;  // e.g., 20 points
            low: number;     // e.g., 10 points
        };
        timeWindow: number;  // in milliseconds
    };
    blacklist: {
        penalties: {
            high: number;    // e.g., -20 points
            medium: number;  // e.g., -10 points
            low: number;     // e.g., -5 points
        };
        ageFactor: number;   // e.g., 0.05 for 5% increase per day
    };
    resonance: {
        thresholds: {
            high: number;    // e.g., 4 signals
            medium: number;  // e.g., 2 signals
            low: number;     // e.g., 1 signal
        };
        weights: {
            high: number;    // e.g., 30 points
            medium: number;  // e.g., 20 points
            low: number;     // e.g., 10 points
        };
    };
}

// Default scoring configuration
// 默认评分配置
const DEFAULT_CONFIG: ScoringConfig = {
    heatScore: {
        thresholds: {
            high: 0.5,    // 50% growth
            medium: 0.3,  // 30% growth
            low: 0.1      // 10% growth
        },
        weights: {
            high: 40,
            medium: 30,
            low: 20
        },
        timeWindow: 3600000 // 1 hour
    },
    buyPressure: {
        thresholds: {
            high: 10,
            medium: 5,
            low: 3
        },
        weights: {
            high: 30,
            medium: 20,
            low: 10
        },
        timeWindow: 300000 // 5 minutes
    },
    blacklist: {
        penalties: {
            high: -20,
            medium: -10,
            low: -5
        },
        ageFactor: 0.05
    },
    resonance: {
        thresholds: {
            high: 4,
            medium: 2,
            low: 1
        },
        weights: {
            high: 30,
            medium: 20,
            low: 10
        }
    }
};

// Heat score calculation with time decay
// 带时间衰减的热度评分计算
function calcHeatScore(mentions: TelegramMention[], config: ScoringConfig['heatScore']): number {
    try {
        const now = Date.now();
        const timeWindow = config.timeWindow;
        const previousWindow = now - (timeWindow * 2);

        // Calculate mentions in current and previous window
        // 计算当前和前一窗口的提及次数
        const currentMentions = mentions.filter(m => m.timestamp >= now - timeWindow).length;
        const previousMentions = mentions.filter(m => 
            m.timestamp >= previousWindow && m.timestamp < now - timeWindow
        ).length;

        // Calculate growth rate with validation
        // 计算增长率并进行验证
        const growthRate = previousMentions === 0 ? 0 : 
            (currentMentions - previousMentions) / previousMentions;

        // Apply time decay
        // 应用时间衰减
        const timeDecay = 1 - (TIME_DECAY_FACTOR * (now - Math.max(...mentions.map(m => m.timestamp))) / timeWindow);

        // Score based on growth rate and thresholds
        // 基于增长率和阈值评分
        if (growthRate >= config.thresholds.high) {
            return config.weights.high * timeDecay;
        } else if (growthRate >= config.thresholds.medium) {
            return config.weights.medium * timeDecay;
        } else if (growthRate >= config.thresholds.low) {
            return config.weights.low * timeDecay;
        }
        return 0;
    } catch (error: unknown) {
        logger.error('Error calculating heat score', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

// Buy pressure score calculation with validation
// 带验证的买入压力评分计算
function calcBuyPressureScore(trades: TradeData[], config: ScoringConfig['buyPressure']): number {
    try {
        const now = Date.now();
        const timeWindow = config.timeWindow;

        // Validate and filter trades
        // 验证和过滤交易
        const validTrades = trades.filter(t => 
            t.timestamp >= now - timeWindow && 
            t.type === 'buy' &&
            t.amount > 0 &&
            t.price > 0
        );

        // Count recent buys
        // 计算最近买入
        const recentBuys = validTrades.length;

        // Score based on thresholds
        // 基于阈值评分
        if (recentBuys >= config.thresholds.high) {
            return config.weights.high;
        } else if (recentBuys >= config.thresholds.medium) {
            return config.weights.medium;
        } else if (recentBuys >= config.thresholds.low) {
            return config.weights.low;
        }
        return 0;
    } catch (error: unknown) {
        logger.error('Error calculating buy pressure score', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

// Blacklist penalty calculation with age factor
// 带年龄因子的黑名单惩罚计算
function calcBlacklistPenalty(
    blacklistStatus: BlacklistEntry | undefined, 
    config: ScoringConfig['blacklist']
): number {
    try {
        if (!blacklistStatus) return 0;

        // Get base penalty
        // 获取基础惩罚
        const basePenalty = config.penalties[blacklistStatus.severity] || 0;

        // Apply age factor
        // 应用年龄因子
        const ageFactor = 1 + (blacklistStatus.age * config.ageFactor);
        return basePenalty * ageFactor;
    } catch (error: unknown) {
        logger.error('Error calculating blacklist penalty', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

// Resonance score calculation with validation
// 带验证的共振评分计算
function calcResonanceScore(
    triggeredSignals: SignalType[], 
    config: ScoringConfig['resonance']
): number {
    try {
        // Validate signals
        // 验证信号
        const validSignals = triggeredSignals.filter(signal => 
            Object.values(SignalType).includes(signal)
        );

        const uniqueSignals = new Set(validSignals).size;
        
        // Score based on thresholds
        // 基于阈值评分
        if (uniqueSignals >= config.thresholds.high) {
            return config.weights.high;
        } else if (uniqueSignals >= config.thresholds.medium) {
            return config.weights.medium;
        } else if (uniqueSignals >= config.thresholds.low) {
            return config.weights.low;
        }
        return 0;
    } catch (error: unknown) {
        logger.error('Error calculating resonance score', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

// Main evaluator class
// 主评估器类
export class SignalEvaluator {
    private config: ScoringConfig;

    constructor(config: Partial<ScoringConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
    }

    // Evaluate a signal
    // 评估信号
    async evaluate(input: SignalEvaluationInput): Promise<EvaluationResult> {
        try {
            // Validate input
            // 验证输入
            this.validateInput(input);

            // Calculate component scores
            // 计算组件分数
            const components: ScoreComponents = {
                heatScore: calcHeatScore(input.telegramMentions, this.config.heatScore),
                buyPressureScore: calcBuyPressureScore(input.trades, this.config.buyPressure),
                blacklistPenalty: calcBlacklistPenalty(input.blacklistStatus, this.config.blacklist),
                resonanceScore: calcResonanceScore(input.triggeredSignals, this.config.resonance)
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
        } catch (error: unknown) {
            logger.error('Error evaluating signal', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    // Validate input data
    // 验证输入数据
    private validateInput(input: SignalEvaluationInput): void {
        if (!input.signal || !input.signal.tokenAddress) {
            throw new Error('Invalid signal input: missing token address');
        }
        if (!Array.isArray(input.telegramMentions)) {
            throw new Error('Invalid input: telegramMentions must be an array');
        }
        if (!Array.isArray(input.trades)) {
            throw new Error('Invalid input: trades must be an array');
        }
        if (!Array.isArray(input.triggeredSignals)) {
            throw new Error('Invalid input: triggeredSignals must be an array');
        }
    }

    // Calculate confidence level
    // 计算置信度
    private calculateConfidence(components: ScoreComponents): number {
        try {
            const maxPossibleScore = 
                this.config.heatScore.weights.high +
                this.config.buyPressure.weights.high +
                this.config.resonance.weights.high;

            const actualScore = 
                components.heatScore + 
                components.buyPressureScore + 
                components.resonanceScore;

            return Math.min(1, actualScore / maxPossibleScore);
        } catch (error: unknown) {
            logger.error('Error calculating confidence', error instanceof Error ? error : new Error(String(error)));
            return 0;
        }
    }

    // Generate reasons for the score
    // 生成分数原因
    private generateReasons(components: ScoreComponents): string[] {
        const reasons: string[] = [];

        if (components.heatScore > 0) {
            reasons.push(`Heat score: ${components.heatScore.toFixed(2)} (TG mentions growth)`);
        }
        if (components.buyPressureScore > 0) {
            reasons.push(`Buy pressure: ${components.buyPressureScore.toFixed(2)} (recent buy trades)`);
        }
        if (components.blacklistPenalty < 0) {
            reasons.push(`Blacklist penalty: ${components.blacklistPenalty.toFixed(2)} (token in blacklist)`);
        }
        if (components.resonanceScore > 0) {
            reasons.push(`Signal resonance: ${components.resonanceScore.toFixed(2)} (multiple GMGN signals)`);
        }

        return reasons;
    }

    // Update configuration
    // 更新配置
    public updateConfig(newConfig: Partial<ScoringConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }
} 