import { PreEvaluatorConfig } from '../modules/signals/evaluator';

// Default configuration for signal pre-evaluator
// 信号预评估器的默认配置
export const defaultPreEvaluatorConfig: PreEvaluatorConfig = {
    thresholds: {
        totalScore: 70,           // Minimum score to pass / 通过的最低分数
        sentimentWeight: 0.25,    // Weight for sentiment score / 舆情得分权重
        txWeight: 0.25,          // Weight for transaction score / 交易得分权重
        smartMoneyWeight: 0.25,   // Weight for Smart Money score / Smart Money得分权重
        riskWeight: 0.25,        // Weight for risk score / 风险得分权重
    },
    timeWindows: {
        sentiment: 3600000,      // 1 hour in milliseconds / 1小时（毫秒）
        transactions: 1800000,   // 30 minutes in milliseconds / 30分钟（毫秒）
    },
    blacklist: {
        addresses: [],           // Blacklisted addresses / 黑名单地址
        patterns: [              // Risk patterns / 风险模式
            'rugpull',
            'honeypot',
            'scam',
            'fake'
        ],
    },
}; 