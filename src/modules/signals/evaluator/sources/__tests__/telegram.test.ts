// Telegram source unit tests
// Telegram源单元测试

import { TelegramSource } from '../telegram';
import { GMGNSignalType } from '../../types/signal';

// Mock Telegraf with error handling
// 模拟Telegraf错误处理
jest.mock('telegraf', () => {
    return {
        Telegraf: jest.fn().mockImplementation((token) => {
            if (token === 'invalid-token') {
                throw new Error('Invalid token');
            }
            return {
                on: jest.fn(),
                launch: jest.fn().mockResolvedValue(undefined),
                stop: jest.fn().mockResolvedValue(undefined)
            };
        })
    };
});

// Test configuration
// 测试配置
const testConfig = {
    name: 'test-telegram',
    weight: 0.5,
    timeWindow: 60,
    enabled: true,
    apiToken: 'test-token',
    targetIds: ['-1001234567890'],
    cacheSize: 100
};

describe('TelegramSource', () => {
    let source: TelegramSource;

    beforeEach(() => {
        source = new TelegramSource(testConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test initialization
    // 测试初始化
    describe('initialization', () => {
        it('should initialize successfully', async () => {
            await expect(source.initialize()).resolves.not.toThrow();
            expect(source.isReady()).toBe(true);
        });

        it('should handle initialization errors', async () => {
            const errorSource = new TelegramSource({
                ...testConfig,
                apiToken: 'invalid-token'
            });
            await expect(errorSource.initialize()).rejects.toThrow();
            expect(errorSource.isReady()).toBe(false);
        });
    });

    // Test signal type detection
    // 测试信号类型检测
    describe('signal type detection', () => {
        const testCases = [
            {
                message: '🚨 CTO Signal: $GMGN',
                expectedType: GMGNSignalType.CTO
            },
            {
                message: 'Update Social Info for $GMGN',
                expectedType: GMGNSignalType.UPDATE_SOCIAL
            },
            {
                message: 'PUMP Social Update: $GMGN',
                expectedType: GMGNSignalType.PUMP_SOCIAL
            },
            {
                message: 'PUMP FDV Surge Alert: $GMGN',
                expectedType: GMGNSignalType.PUMP_FDV_SURGE
            },
            {
                message: 'Solana FDV Surge: $GMGN',
                expectedType: GMGNSignalType.SOL_FDV_SURGE
            },
            {
                message: 'Smart Money FOMO: $GMGN',
                expectedType: GMGNSignalType.SMART_MONEY_FOMO
            },
            {
                message: 'KOL FOMO Signal: $GMGN',
                expectedType: GMGNSignalType.KOL_FOMO
            },
            {
                message: 'DEV Burn Alert: $GMGN',
                expectedType: GMGNSignalType.DEV_BURN
            },
            {
                message: 'ATH Price Alert: $GMGN at $1.23',
                expectedType: GMGNSignalType.ATH_PRICE
            },
            {
                message: 'Heavy Buy Alert: $GMGN 100 ETH',
                expectedType: GMGNSignalType.HEAVY_BUY
            },
            {
                message: 'Sniper New Token: $GMGN',
                expectedType: GMGNSignalType.SNIPER_NEW
            }
        ];

        testCases.forEach(({ message, expectedType }) => {
            it(`should detect ${expectedType} signal type`, async () => {
                await source.initialize();
                const mentions = await source['extractMentions'](message, Date.now() / 1000);
                expect(mentions[0].signalType).toBe(expectedType);
            });
        });
    });

    // Test signal data extraction
    // 测试信号数据提取
    describe('signal data extraction', () => {
        it('should extract price data from ATH signal', async () => {
            await source.initialize();
            const mentions = await source['extractMentions'](
                'ATH Price Alert: $GMGN at $1.23',
                Date.now() / 1000
            );
            expect(mentions[0].metadata.signalData?.price).toBe(1.23);
        });

        it('should extract volume data from heavy buy signal', async () => {
            await source.initialize();
            const mentions = await source['extractMentions'](
                'Heavy Buy Alert: $GMGN 100 ETH',
                Date.now() / 1000
            );
            expect(mentions[0].metadata.signalData?.volume).toBe(100);
        });

        it('should extract burn amount from burn signal', async () => {
            await source.initialize();
            const mentions = await source['extractMentions'](
                'DEV Burn Alert: $GMGN burned 50 ETH',
                Date.now() / 1000
            );
            expect(mentions[0].metadata.signalData?.burnAmount).toBe(50);
        });

        it('should extract FDV data from surge signal', async () => {
            await source.initialize();
            const mentions = await source['extractMentions'](
                'PUMP FDV Surge: $GMGN 1.5B',
                Date.now() / 1000
            );
            expect(mentions[0].metadata.signalData?.fdv).toBe(1500);
        });

        it('should extract social update status', async () => {
            await source.initialize();
            const mentions = await source['extractMentions'](
                'Update Social: $GMGN Twitter, Telegram, Website',
                Date.now() / 1000
            );
            expect(mentions[0].metadata.signalData?.socialUpdate).toEqual({
                twitter: true,
                telegram: true,
                website: true
            });
        });
    });

    // Test sentiment scoring
    // 测试舆情评分
    describe('sentiment scoring', () => {
        beforeEach(async () => {
            await source.initialize();
        });

        it('should calculate base score from mention frequency', async () => {
            const mentions = [
                { symbol: 'GMGN', timestamp: Date.now() / 1000, content: 'Test', source: 'telegram', metadata: { type: 'mention' } },
                { symbol: 'GMGN', timestamp: Date.now() / 1000, content: 'Test', source: 'telegram', metadata: { type: 'mention' } }
            ];
            const score = await source['calculateSentimentScore'](mentions);
            expect(score).toBeGreaterThan(0);
        });

        it('should apply signal type multiplier', async () => {
            const mentions = [
                {
                    symbol: 'GMGN',
                    timestamp: Date.now() / 1000,
                    content: 'Smart Money FOMO: $GMGN',
                    source: 'telegram',
                    signalType: GMGNSignalType.SMART_MONEY_FOMO,
                    metadata: { type: 'mention' }
                }
            ];
            const score = await source['calculateSentimentScore'](mentions);
            expect(score).toBeGreaterThan(0);
        });

        it('should apply time decay', async () => {
            const oldTimestamp = (Date.now() / 1000) - 7200; // 2 hours ago
            const mentions = [
                {
                    symbol: 'GMGN',
                    timestamp: oldTimestamp,
                    content: 'Test',
                    source: 'telegram',
                    metadata: { type: 'mention' }
                }
            ];
            const score = await source['calculateSentimentScore'](mentions);
            expect(score).toBeLessThan(100);
        });
    });

    // Test cleanup
    // 测试清理
    describe('cleanup', () => {
        it('should cleanup resources', async () => {
            await source.initialize();
            await expect(source.cleanup()).resolves.not.toThrow();
            expect(source.isReady()).toBe(false);
        });
    });
}); 