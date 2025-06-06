/**
 * Signal Evaluator Core Module
 * 信号评估器核心模块
 * 
 * This module is responsible for evaluating trading signals based on multiple factors:
 * - Telegram mentions and their growth rate
 * - Recent buy pressure from trades
 * - Blacklist status and age
 * - Signal resonance from multiple sources
 * 
 * 该模块负责基于多个因素评估交易信号：
 * - Telegram提及及其增长率
 * - 最近的交易买入压力
 * - 黑名单状态和年龄
 * - 来自多个来源的信号共振
 * 
 * Related Files:
 * - ../types/score.ts: Contains score-related types and constants
 * - ../types/signal.ts: Contains signal-related types and interfaces
 * - ../utils/logger.ts: Provides logging functionality
 * 
 * 相关文件：
 * - ../types/score.ts: 包含评分相关的类型和常量
 * - ../types/signal.ts: 包含信号相关的类型和接口
 * - ../utils/logger.ts: 提供日志功能
 * 
 * Usage Example:
 * const evaluator = new SignalEvaluator();
 * const result = await evaluator.evaluate({
 *   signal: { tokenAddress: '0x...' },
 *   telegramMentions: [...],
 *   trades: [...],
 *   triggeredSignals: [...]
 * });
 * 
 * 使用示例：
 * const evaluator = new SignalEvaluator();
 * const result = await evaluator.evaluate({
 *   signal: { tokenAddress: '0x...' },
 *   telegramMentions: [...],
 *   trades: [...],
 *   triggeredSignals: [...]
 * });
 */

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

// Scoring configuration interface
// Defines the structure for all scoring parameters and thresholds
// 评分配置接口
// 定义所有评分参数和阈值的结构
interface ScoringConfig {
    // Heat score configuration
    // Defines thresholds and weights for telegram mention growth
    // 热度评分配置
    // 定义telegram提及增长的阈值和权重
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
    // Buy pressure configuration
    // Defines thresholds and weights for recent buy trades
    // 买入压力配置
    // 定义最近买入交易的阈值和权重
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
    // Blacklist configuration
    // Defines penalties for blacklisted tokens
    // 黑名单配置
    // 定义黑名单代币的惩罚
    blacklist: {
        penalties: {
            high: number;    // e.g., -20 points
            medium: number;  // e.g., -10 points
            low: number;     // e.g., -5 points
        };
        ageFactor: number;   // e.g., 0.05 for 5% increase per day
    };
    // Resonance configuration
    // Defines thresholds and weights for signal resonance
    // 共振配置
    // 定义信号共振的阈值和权重
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
// These values can be overridden when creating a new SignalEvaluator instance
// 默认评分配置
// 创建新的SignalEvaluator实例时可以覆盖这些值
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
// Calculates score based on telegram mention growth rate and applies time decay
// 带时间衰减的热度评分计算
// 基于telegram提及增长率计算分数并应用时间衰减
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
        // The more recent the mentions, the higher the score
        // 应用时间衰减
        // 提及越新，分数越高
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
// Calculates score based on recent buy trades with amount and price validation
// 带验证的买入压力评分计算
// 基于最近的买入交易计算分数，包括数量和价格验证
function calcBuyPressureScore(trades: TradeData[], config: ScoringConfig['buyPressure']): number {
    try {
        const now = Date.now();
        const timeWindow = config.timeWindow;

        // Validate and filter trades
        // Only count valid buy trades within the time window
        // 验证和过滤交易
        // 只计算时间窗口内的有效买入交易
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
// Calculates penalty based on blacklist severity and age
// 带年龄因子的黑名单惩罚计算
// 基于黑名单严重程度和年龄计算惩罚
function calcBlacklistPenalty(
    blacklistStatus: BlacklistEntry | undefined, 
    config: ScoringConfig['blacklist']
): number {
    try {
        if (!blacklistStatus) return 0;

        // Get base penalty based on severity
        // 基于严重程度获取基础惩罚
        const basePenalty = config.penalties[blacklistStatus.severity] || 0;

        // Apply age factor
        // Older blacklist entries have higher penalties
        // 应用年龄因子
        // 较老的黑名单条目有更高的惩罚
        const ageFactor = 1 + (blacklistStatus.age * config.ageFactor);
        return basePenalty * ageFactor;
    } catch (error: unknown) {
        logger.error('Error calculating blacklist penalty', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

// Resonance score calculation with validation
// Calculates score based on number of unique triggered signals
// 带验证的共振评分计算
// 基于唯一触发信号的数量计算分数
function calcResonanceScore(
    triggeredSignals: SignalType[], 
    config: ScoringConfig['resonance']
): number {
    try {
        // Validate signals
        // Ensure all signals are valid SignalType values
        // 验证信号
        // 确保所有信号都是有效的SignalType值
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
// Handles the complete signal evaluation process
// 主评估器类
// 处理完整的信号评估过程
export class SignalEvaluator {
    private config: ScoringConfig;

    // Constructor with optional configuration override
    // 带有可选配置覆盖的构造函数
    constructor(config: Partial<ScoringConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
    }

    // Evaluate a signal
    // Main method that processes the signal and returns evaluation result
    // 评估信号
    // 处理信号并返回评估结果的主方法
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
    // Ensures all required fields are present and valid
    // 验证输入数据
    // 确保所有必需字段都存在且有效
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
    // Determines how confident we are in the evaluation
    // 计算置信度
    // 确定我们对评估的置信程度
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
    // Creates human-readable explanations for the score components
    // 生成分数原因
    // 为分数组件创建人类可读的解释
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
    // Allows dynamic updates to scoring rules
    // 更新配置
    // 允许动态更新评分规则
    public updateConfig(newConfig: Partial<ScoringConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }
} 