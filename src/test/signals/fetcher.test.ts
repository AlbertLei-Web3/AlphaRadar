// Signal Fetcher Test Suite
// 信号抓取器测试套件

import { SignalFetcher, RawSignal } from '../../modules/signals/fetcher';
import { Telegraf } from 'telegraf';

// Mock Telegraf
// 模拟Telegraf
jest.mock('telegraf', () => {
    return {
        Telegraf: jest.fn().mockImplementation(() => ({
            launch: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
        })),
    };
});

describe('SignalFetcher', () => {
    let fetcher: SignalFetcher;
    let mockEmit: jest.SpyInstance;

    beforeEach(() => {
        // Create new instance for each test
        // 为每个测试创建新实例
        fetcher = new SignalFetcher();
        mockEmit = jest.spyOn(fetcher, 'emit');
    });

    afterEach(() => {
        // Clean up after each test
        // 每个测试后清理
        jest.clearAllMocks();
    });

    // Test basic initialization
    // 测试基本初始化
    describe('Initialization', () => {
        it('should create a new instance', () => {
            expect(fetcher).toBeInstanceOf(SignalFetcher);
        });

        it('should initialize with empty message queue', () => {
            expect(fetcher['messageQueue']).toHaveLength(0);
        });
    });

    // Test start/stop functionality
    // 测试启动/停止功能
    describe('Start/Stop', () => {
        it('should start successfully', async () => {
            await expect(fetcher.start()).resolves.not.toThrow();
            expect(mockEmit).toHaveBeenCalledWith('newSignal', expect.any(Object));
        });

        it('should stop successfully', async () => {
            await fetcher.start();
            await expect(fetcher.stop()).resolves.not.toThrow();
        });

        it('should not start if already running', async () => {
            await fetcher.start();
            const startSpy = jest.spyOn(fetcher['telegramBot'], 'launch');
            await fetcher.start();
            expect(startSpy).not.toHaveBeenCalled();
        });
    });

    // Test message handling
    // 测试消息处理
    describe('Message Handling', () => {
        it('should process valid messages', () => {
            const mockMessage = {
                text: '🔔 CTO Signal: 0x123...',
                chat: { id: 123 },
                message_id: 456,
                from: { id: 789 }
            };

            // Simulate Telegram message
            // 模拟Telegram消息
            const telegramBot = fetcher['telegramBot'];
            const messageHandler = (telegramBot.on as jest.Mock).mock.calls[0][1];
            messageHandler({ message: mockMessage });

            expect(mockEmit).toHaveBeenCalledWith('newSignal', expect.objectContaining({
                source: 'telegram',
                content: mockMessage.text,
                metadata: expect.any(Object)
            }));
        });

        it('should handle empty messages', () => {
            const mockMessage = {
                text: '',
                chat: { id: 123 },
                message_id: 456,
                from: { id: 789 }
            };

            const telegramBot = fetcher['telegramBot'];
            const messageHandler = (telegramBot.on as jest.Mock).mock.calls[0][1];
            messageHandler({ message: mockMessage });

            expect(mockEmit).toHaveBeenCalledWith('newSignal', expect.objectContaining({
                content: ''
            }));
        });
    });

    // Test manual signal injection
    // 测试手动信号注入
    describe('Manual Signal Injection', () => {
        it('should accept manually added signals', () => {
            const manualSignal: RawSignal = {
                source: 'manual',
                content: 'Test signal',
                timestamp: Date.now()
            };

            fetcher.addSignal(manualSignal);

            expect(mockEmit).toHaveBeenCalledWith('newSignal', manualSignal);
        });

        it('should process manually added signals in queue', async () => {
            const manualSignal: RawSignal = {
                source: 'manual',
                content: 'Test signal',
                timestamp: Date.now()
            };

            fetcher.addSignal(manualSignal);
            await fetcher.start();

            expect(mockEmit).toHaveBeenCalledWith('signal', manualSignal);
        });
    });

    // Test error handling
    // 测试错误处理
    describe('Error Handling', () => {
        it('should handle Telegram API errors', async () => {
            const telegramBot = fetcher['telegramBot'];
            (telegramBot.launch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

            await expect(fetcher.start()).rejects.toThrow('API Error');
        });

        it('should handle message processing errors', () => {
            const mockMessage = {
                text: null,
                chat: { id: 123 },
                message_id: 456,
                from: { id: 789 }
            };

            const telegramBot = fetcher['telegramBot'];
            const messageHandler = (telegramBot.on as jest.Mock).mock.calls[0][1];
            
            // Should not throw error
            // 不应该抛出错误
            expect(() => messageHandler({ message: mockMessage })).not.toThrow();
        });
    });

    // Test queue processing
    // 测试队列处理
    describe('Queue Processing', () => {
        it('should process messages in order', async () => {
            const signals = [
                { source: 'test', content: 'Signal 1', timestamp: Date.now() },
                { source: 'test', content: 'Signal 2', timestamp: Date.now() }
            ];

            signals.forEach(signal => fetcher.addSignal(signal));
            await fetcher.start();

            // Wait for queue processing
            // 等待队列处理
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEmit).toHaveBeenCalledTimes(signals.length * 2); // newSignal + signal events
        });

        it('should handle empty queue', async () => {
            await fetcher.start();
            
            // Wait for queue processing
            // 等待队列处理
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEmit).not.toHaveBeenCalledWith('signal', expect.any(Object));
        });
    });
}); 