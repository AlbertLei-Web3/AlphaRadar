// Evaluator module tests
// 评估器模块测试

import { SignalEvaluator } from '../evaluator';
import { GMGNSignalType } from '../../types/signal';
import { SignalScore } from '../../types/score';
import { TelegramSource } from '../../sources/telegram';

// Mock dependencies
// 模拟依赖
jest.mock('../../sources/telegram');
jest.mock('../../utils/logger');

describe('SignalEvaluator', () => {
    let evaluator: SignalEvaluator;
    const testConfig = {
        name: 'test-evaluator',
        weight: 0.5,
        timeWindow: 60,
        enabled: true,
        sources: ['telegram'],
        minScore: 50,
        maxScore: 100
    };

    beforeEach(() => {
        evaluator = new SignalEvaluator(testConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test initialization
    // 测试初始化
    describe('initialization', () => {
        it('should initialize successfully', async () => {
            await expect(evaluator.initialize()).resolves.not.toThrow();
            expect(evaluator.isReady()).toBe(true);
        });

        it('should handle initialization errors', async () => {
            const errorConfig = { ...testConfig, sources: ['invalid-source'] };
            const errorEvaluator = new SignalEvaluator(errorConfig);
            await expect(errorEvaluator.initialize()).rejects.toThrow();
            expect(errorEvaluator.isReady()).toBe(false);
        });
    });

    // Test signal processing
    // 测试信号处理
    describe('signal processing', () => {
        beforeEach(async () => {
            await evaluator.initialize();
        });

        it('should process valid signals', async () => {
            const signal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Smart Money FOMO: $GMGN',
                source: 'telegram',
                signalType: GMGNSignalType.SMART_MONEY_FOMO,
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(signal);
            expect(result).toBeDefined();
            expect(result.score).toBeGreaterThan(0);
        });

        it('should handle invalid signals', async () => {
            const invalidSignal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Invalid signal',
                source: 'telegram',
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(invalidSignal);
            expect(result.score).toBe(0);
        });

        it('should handle signals with missing data', async () => {
            const incompleteSignal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                source: 'telegram',
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(incompleteSignal as any);
            expect(result.score).toBe(0);
        });
    });

    // Test score calculation
    // 测试分数计算
    describe('score calculation', () => {
        beforeEach(async () => {
            await evaluator.initialize();
        });

        it('should calculate correct score for CTO signal', async () => {
            const signal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'CTO Signal: $GMGN',
                source: 'telegram',
                signalType: GMGNSignalType.CTO,
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(signal);
            expect(result.score).toBeGreaterThan(0);
            expect(result.metadata.signalType).toBe(GMGNSignalType.CTO);
        });

        it('should apply time decay to old signals', async () => {
            const oldTimestamp = (Date.now() / 1000) - 7200; // 2 hours ago
            const signal = {
                symbol: 'GMGN',
                timestamp: oldTimestamp,
                content: 'Smart Money FOMO: $GMGN',
                source: 'telegram',
                signalType: GMGNSignalType.SMART_MONEY_FOMO,
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(signal);
            expect(result.score).toBeLessThan(100);
        });

        it('should handle multiple signals for same symbol', async () => {
            const signals = [
                {
                    symbol: 'GMGN',
                    timestamp: Date.now() / 1000,
                    content: 'Smart Money FOMO: $GMGN',
                    source: 'telegram',
                    signalType: GMGNSignalType.SMART_MONEY_FOMO,
                    metadata: { type: 'mention' }
                },
                {
                    symbol: 'GMGN',
                    timestamp: Date.now() / 1000,
                    content: 'KOL FOMO: $GMGN',
                    source: 'telegram',
                    signalType: GMGNSignalType.KOL_FOMO,
                    metadata: { type: 'mention' }
                }
            ];

            const results = await Promise.all(signals.map(s => evaluator.processSignal(s)));
            expect(results[0].score).not.toBe(results[1].score);
        });
    });

    // Test signal validation
    // 测试信号验证
    describe('signal validation', () => {
        beforeEach(async () => {
            await evaluator.initialize();
        });

        it('should validate signal format', async () => {
            const invalidSignal = {
                symbol: 'GMGN',
                timestamp: 'invalid-timestamp',
                source: 'telegram',
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(invalidSignal as any);
            expect(result.score).toBe(0);
        });

        it('should validate signal source', async () => {
            const invalidSourceSignal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Test signal',
                source: 'invalid-source',
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(invalidSourceSignal);
            expect(result.score).toBe(0);
        });

        it('should validate signal type', async () => {
            const invalidTypeSignal = {
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Test signal',
                source: 'telegram',
                signalType: 'INVALID_TYPE',
                metadata: { type: 'mention' }
            };

            const result = await evaluator.processSignal(invalidTypeSignal as any);
            expect(result.score).toBe(0);
        });
    });

    // Test cleanup
    // 测试清理
    describe('cleanup', () => {
        it('should cleanup resources', async () => {
            await evaluator.initialize();
            await expect(evaluator.cleanup()).resolves.not.toThrow();
            expect(evaluator.isReady()).toBe(false);
        });
    });
}); 