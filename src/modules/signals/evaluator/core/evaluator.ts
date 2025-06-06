/**
 * Signal Evaluator Core Module
 * 信号评估器核心模块
 * 
 * This module is responsible for evaluating trading signals based on multiple factors:
 * - Multiple sentiment sources (Telegram, Twitter, Reddit, Google Trends, etc.)
 * - Recent buy pressure from trades
 * - Blacklist status and age
 * - Signal resonance from multiple sources
 * 
 * 该模块负责基于多个因素评估交易信号：
 * - 多个舆情来源（Telegram、Twitter、Reddit、Google趋势等）
 * - 最近的交易买入压力
 * - 黑名单状态和年龄
 * - 来自多个来源的信号共振
 * 
 * Related Files:
 * - ../types/score.ts: Contains score-related types and constants
 * - ../types/signal.ts: Contains signal-related types and interfaces
 * - ../utils/logger.ts: Provides logging functionality
 * - ../sources/: Contains sentiment source implementations
 * 
 * 相关文件：
 * - ../types/score.ts: 包含评分相关的类型和常量
 * - ../types/signal.ts: 包含信号相关的类型和接口
 * - ../utils/logger.ts: 提供日志功能
 * - ../sources/: 包含舆情来源实现
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
    BlacklistEntry,
    SentimentData
} from '../types/signal';
import { logger } from '../utils/logger';

// Sentiment source interface
// Defines the contract for all sentiment data sources
// 舆情来源接口
// 定义所有舆情数据源的契约
interface SentimentSource {
    // Get sentiment data for a token
    // 获取代币的舆情数据
    getSentimentData(tokenAddress: string, timeWindow: number): Promise<SentimentData[]>;
    
    // Get source weight in overall sentiment calculation
    // 获取在整体舆情计算中的权重
    getWeight(): number;
    
    // Get source name
    // 获取来源名称
    getName(): string;
}

// Sentiment manager class
// Manages multiple sentiment sources and aggregates their data
// 舆情管理器类
// 管理多个舆情来源并聚合它们的数据
class SentimentManager {
    private sources: Map<string, SentimentSource> = new Map();

    // Add a sentiment source
    // 添加舆情来源
    addSource(source: SentimentSource): void {
        this.sources.set(source.getName(), source);
    }

    // Remove a sentiment source
    // 移除舆情来源
    removeSource(sourceName: string): void {
        this.sources.delete(sourceName);
    }

    // Get all sentiment data from all sources
    // 从所有来源获取舆情数据
    async getAllSentimentData(tokenAddress: string, timeWindow: number): Promise<SentimentData[]> {
        const allData: SentimentData[] = [];
        
        for (const source of this.sources.values()) {
            try {
                const sourceData = await source.getSentimentData(tokenAddress, timeWindow);
                allData.push(...sourceData);
            } catch (error: unknown) {
                logger.error(
                    `Error getting sentiment data from ${source.getName()}`,
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        }

        return allData;
    }

    // Get total weight of all sources
    // 获取所有来源的总权重
    getTotalWeight(): number {
        return Array.from(this.sources.values()).reduce(
            (total, source) => total + source.getWeight(),
            0
        );
    }
}

// Scoring configuration interface
// Defines the structure for all scoring parameters and thresholds
// 评分配置接口
// 定义所有评分参数和阈值的结构
interface ScoringConfig {
    // Sentiment configuration
    // Defines thresholds and weights for sentiment analysis
    // 舆情配置
    // 定义舆情分析的阈值和权重
    sentiment: {
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
    sentiment: {
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

// Sentiment score calculation with time decay
// Calculates score based on sentiment data from multiple sources
// 带时间衰减的舆情评分计算
// 基于多个来源的舆情数据计算分数
async function calcSentimentScore(
    sentimentManager: SentimentManager,
    tokenAddress: string,
    config: ScoringConfig['sentiment']
): Promise<number> {
    try {
        const now = Date.now();
        const timeWindow = config.timeWindow;
        const previousWindow = now - (timeWindow * 2);

        // Get sentiment data from all sources
        // 从所有来源获取舆情数据
        const allSentimentData = await sentimentManager.getAllSentimentData(tokenAddress, timeWindow);

        // Calculate current and previous window sentiment
        // 计算当前和前一窗口的舆情
        const currentSentiment = allSentimentData.filter(d => d.timestamp >= now - timeWindow);
        const previousSentiment = allSentimentData.filter(d => 
            d.timestamp >= previousWindow && d.timestamp < now - timeWindow
        );

        // Calculate weighted sentiment scores
        // 计算加权舆情分数
        const currentScore = currentSentiment.reduce((sum, data) => 
            sum + (data.score * data.sourceWeight), 0
        );
        const previousScore = previousSentiment.reduce((sum, data) => 
            sum + (data.score * data.sourceWeight), 0
        );

        // Calculate growth rate
        // 计算增长率
        const growthRate = previousScore === 0 ? 0 : 
            (currentScore - previousScore) / previousScore;

        // Apply time decay
        // 应用时间衰减
        const timeDecay = 1 - (TIME_DECAY_FACTOR * (now - Math.max(...allSentimentData.map(d => d.timestamp))) / timeWindow);

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
        logger.error('Error calculating sentiment score', error instanceof Error ? error : new Error(String(error)));
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
    private sentimentManager: SentimentManager;

    // Constructor with optional configuration override
    // 带有可选配置覆盖的构造函数
    constructor(config: Partial<ScoringConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        this.sentimentManager = new SentimentManager();
    }

    // Add a sentiment source
    // 添加舆情来源
    public addSentimentSource(source: SentimentSource): void {
        this.sentimentManager.addSource(source);
    }

    // Remove a sentiment source
    // 移除舆情来源
    public removeSentimentSource(sourceName: string): void {
        this.sentimentManager.removeSource(sourceName);
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
                sentimentScore: await calcSentimentScore(
                    this.sentimentManager,
                    input.signal.tokenAddress,
                    this.config.sentiment
                ),
                buyPressureScore: calcBuyPressureScore(input.trades, this.config.buyPressure),
                blacklistPenalty: calcBlacklistPenalty(input.blacklistStatus, this.config.blacklist),
                resonanceScore: calcResonanceScore(input.triggeredSignals, this.config.resonance)
            };

            // Calculate total score
            // 计算总分
            const totalScore = Math.min(100, 
                components.sentimentScore + 
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
                this.config.sentiment.weights.high +
                this.config.buyPressure.weights.high +
                this.config.resonance.weights.high;

            const actualScore = 
                components.sentimentScore + 
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

        if (components.sentimentScore > 0) {
            reasons.push(`Sentiment score: ${components.sentimentScore.toFixed(2)} (multiple sources)`);
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