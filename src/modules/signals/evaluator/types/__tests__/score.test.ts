// Score module tests
// 分数模块测试

import { calculateBaseScore, calculateTimeDecay, calculateSignalMultiplier } from '../score';
import { GMGNSignalType } from '../signal';

describe('Score Calculations', () => {
    // Test base score calculation
    // 测试基础分数计算
    describe('base score calculation', () => {
        it('should calculate correct base score for single mention', () => {
            const mentions = [{
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Test',
                source: 'telegram',
                metadata: { type: 'mention' }
            }];
            const score = calculateBaseScore(mentions);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });

        it('should calculate higher score for multiple mentions', () => {
            const mentions = [
                {
                    symbol: 'GMGN',
                    timestamp: Date.now() / 1000,
                    content: 'Test 1',
                    source: 'telegram',
                    metadata: { type: 'mention' }
                },
                {
                    symbol: 'GMGN',
                    timestamp: Date.now() / 1000,
                    content: 'Test 2',
                    source: 'telegram',
                    metadata: { type: 'mention' }
                }
            ];
            const score = calculateBaseScore(mentions);
            expect(score).toBeGreaterThan(calculateBaseScore([mentions[0]]));
        });

        it('should handle empty mentions array', () => {
            const score = calculateBaseScore([]);
            expect(score).toBe(0);
        });
    });

    // Test time decay calculation
    // 测试时间衰减计算
    describe('time decay calculation', () => {
        it('should apply no decay to recent signals', () => {
            const recentTimestamp = Date.now() / 1000;
            const decay = calculateTimeDecay(recentTimestamp);
            expect(decay).toBe(1);
        });

        it('should apply decay to old signals', () => {
            const oldTimestamp = (Date.now() / 1000) - 7200; // 2 hours ago
            const decay = calculateTimeDecay(oldTimestamp);
            expect(decay).toBeLessThan(1);
        });

        it('should handle future timestamps', () => {
            const futureTimestamp = (Date.now() / 1000) + 3600; // 1 hour in future
            const decay = calculateTimeDecay(futureTimestamp);
            expect(decay).toBe(1);
        });
    });

    // Test signal multiplier calculation
    // 测试信号乘数计算
    describe('signal multiplier calculation', () => {
        it('should apply correct multiplier for CTO signal', () => {
            const multiplier = calculateSignalMultiplier(GMGNSignalType.CTO);
            expect(multiplier).toBeGreaterThan(1);
        });

        it('should apply correct multiplier for SMART_MONEY_FOMO signal', () => {
            const multiplier = calculateSignalMultiplier(GMGNSignalType.SMART_MONEY_FOMO);
            expect(multiplier).toBeGreaterThan(1);
        });

        it('should handle undefined signal type', () => {
            const multiplier = calculateSignalMultiplier(undefined);
            expect(multiplier).toBe(1);
        });

        it('should handle invalid signal type', () => {
            const multiplier = calculateSignalMultiplier('INVALID_TYPE' as GMGNSignalType);
            expect(multiplier).toBe(1);
        });
    });

    // Test edge cases
    // 测试边界情况
    describe('edge cases', () => {
        it('should handle very old signals', () => {
            const veryOldTimestamp = (Date.now() / 1000) - 86400; // 24 hours ago
            const decay = calculateTimeDecay(veryOldTimestamp);
            expect(decay).toBeGreaterThan(0);
            expect(decay).toBeLessThan(1);
        });

        it('should handle very frequent mentions', () => {
            const mentions = Array(100).fill({
                symbol: 'GMGN',
                timestamp: Date.now() / 1000,
                content: 'Test',
                source: 'telegram',
                metadata: { type: 'mention' }
            });
            const score = calculateBaseScore(mentions);
            expect(score).toBeLessThanOrEqual(100);
        });

        it('should handle mixed signal types', () => {
            const signals = [
                GMGNSignalType.CTO,
                GMGNSignalType.SMART_MONEY_FOMO,
                GMGNSignalType.KOL_FOMO
            ];
            const multipliers = signals.map(calculateSignalMultiplier);
            expect(multipliers.every(m => m >= 1)).toBe(true);
        });
    });
}); 