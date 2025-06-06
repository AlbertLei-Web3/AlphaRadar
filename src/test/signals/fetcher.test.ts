// Signal Fetcher Test Suite
// 信号抓取器测试套件

import { SignalFetcher, RawSignal } from '../../modules/signals/fetcher';
import { Telegraf } from 'telegraf';

// Test configuration
// 测试配置
const TEST_TIMEOUT = 5000; // 5 seconds timeout for async tests
const QUEUE_PROCESSING_DELAY = 100; // Delay for queue processing

// Mock Telegraf
// 模拟Telegraf
let registeredHandler: any = null;
jest.mock('telegraf', () => {
    return {
        Telegraf: jest.fn().mockImplementation(() => ({
            launch: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            on: jest.fn((event, handler) => {
                if (event === 'message') {
                    registeredHandler = handler;
                }
            }),
        })),
    };
});

// Helper functions
// 辅助函数
const createMockMessage = (text: string) => ({
    text,
    chat: { id: 123 },
    message_id: 456,
    from: { id: 789 }
});

const createMockSignal = (content: string): RawSignal => ({
    source: 'test',
    content,
    timestamp: Date.now()
});

const waitForQueueProcessing = async () => {
    await new Promise(resolve => setTimeout(resolve, QUEUE_PROCESSING_DELAY));
};

describe('SignalFetcher', () => {
    let fetcher: SignalFetcher;

    beforeEach(() => {
        registeredHandler = null;
        jest.clearAllMocks();
        fetcher = new SignalFetcher();
        expect(registeredHandler).not.toBeNull();
    });

    afterEach(async () => {
        await fetcher.reset();
    });

    // Initialization tests
    // 初始化测试
    describe('Initialization', () => {
        it('should create a new instance', () => {
            expect(fetcher).toBeInstanceOf(SignalFetcher);
        });

        it('should initialize with empty message queue', () => {
            expect(fetcher['messageQueue']).toHaveLength(0);
        });
    });

    // Start/Stop tests
    // 启动/停止测试
    describe('Start/Stop', () => {
        it('should start successfully', async () => {
            await expect(fetcher.start()).resolves.not.toThrow();
        }, TEST_TIMEOUT);

        it('should stop successfully', async () => {
            await fetcher.start();
            await expect(fetcher.stop()).resolves.not.toThrow();
        }, TEST_TIMEOUT);

        it('should not start if already running', async () => {
            const launchSpy = jest.spyOn(fetcher['telegramBot'], 'launch');
            await fetcher.start();
            await fetcher.start();
            expect(launchSpy).toHaveBeenCalledTimes(1);
        }, TEST_TIMEOUT);
    });

    // Message handling tests
    // 消息处理测试
    describe('Message Handling', () => {
        it('should process valid messages', async () => {
            const mockMessage = createMockMessage('🔔 CTO Signal: 0x123...');
            const emitSpy = jest.spyOn(fetcher, 'emit');
            
            if (registeredHandler) {
                await registeredHandler.call(fetcher, { 
                    message: mockMessage, 
                    chat: mockMessage.chat, 
                    from: mockMessage.from 
                });
                await waitForQueueProcessing();
            }

            expect(emitSpy).toHaveBeenCalledWith('newSignal', expect.objectContaining({
                source: 'telegram',
                content: mockMessage.text,
                metadata: expect.any(Object)
            }));
        }, TEST_TIMEOUT);

        it('should handle empty messages', async () => {
            const mockMessage = createMockMessage('');
            const emitSpy = jest.spyOn(fetcher, 'emit');
            
            if (registeredHandler) {
                await registeredHandler.call(fetcher, { 
                    message: mockMessage, 
                    chat: mockMessage.chat, 
                    from: mockMessage.from 
                });
                await waitForQueueProcessing();
            }

            expect(emitSpy).toHaveBeenCalledWith('newSignal', expect.objectContaining({
                content: ''
            }));
        }, TEST_TIMEOUT);

        it('should not process invalid messages', async () => {
            const invalidMessages = [
                { text: null },
                { text: undefined },
                { text: 'valid', chat: null },
                { text: 'valid', chat: { id: null } },
                { text: 'valid', chat: { id: 123 }, message_id: null },
                { text: 'valid', chat: { id: 123 }, message_id: 456, from: null },
                { text: 'valid', chat: { id: 123 }, message_id: 456, from: { id: null } }
            ];

            for (const invalidMessage of invalidMessages) {
                const emitSpy = jest.spyOn(fetcher, 'emit');
                const queueSpy = jest.spyOn(fetcher['messageQueue'], 'push');

                if (registeredHandler) {
                    await registeredHandler.call(fetcher, { message: invalidMessage });
                    await waitForQueueProcessing();
                }

                expect(emitSpy).not.toHaveBeenCalledWith('newSignal', expect.anything());
                expect(queueSpy).not.toHaveBeenCalled();
            }
        }, TEST_TIMEOUT);
    });

    // Manual signal injection tests
    // 手动信号注入测试
    describe('Manual Signal Injection', () => {
        it('should accept manually added signals', () => {
            const manualSignal = createMockSignal('Test signal');
            const emitSpy = jest.spyOn(fetcher, 'emit');
            
            fetcher.addSignal(manualSignal);
            
            expect(emitSpy).toHaveBeenCalledWith('newSignal', manualSignal);
        });

        it('should process manually added signals in queue', async () => {
            const manualSignal = createMockSignal('Test signal');
            let processed = false;
            
            fetcher.on('signal', () => { processed = true; });
            fetcher.addSignal(manualSignal);
            await fetcher.start();
            await waitForQueueProcessing();
            
            expect(processed).toBe(true);
        }, TEST_TIMEOUT);
    });

    // Error handling tests
    // 错误处理测试
    describe('Error Handling', () => {
        it('should handle Telegram API errors', async () => {
            const telegramBot = fetcher['telegramBot'];
            (telegramBot.launch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
            
            await expect(fetcher.start()).rejects.toThrow('API Error');
        }, TEST_TIMEOUT);

        it('should handle message processing errors', async () => {
            const badMessage = { text: null };
            const emitSpy = jest.spyOn(fetcher, 'emit');
            
            if (registeredHandler) {
                await registeredHandler.call(fetcher, { message: badMessage });
                await waitForQueueProcessing();
            }
            
            expect(emitSpy).not.toHaveBeenCalledWith('newSignal', expect.anything());
        }, TEST_TIMEOUT);
    });

    // Queue processing tests
    // 队列处理测试
    describe('Queue Processing', () => {
        it('should process messages in order', async () => {
            const signals = [
                createMockSignal('Signal 1'),
                createMockSignal('Signal 2')
            ];
            let processedSignals: any[] = [];
            
            fetcher.on('signal', (signal) => {
                processedSignals.push(signal);
            });
            
            signals.forEach(signal => fetcher.addSignal(signal));
            await fetcher.start();
            await waitForQueueProcessing();
            
            expect(processedSignals.length).toBe(signals.length);
            expect(processedSignals[0].content).toBe('Signal 1');
            expect(processedSignals[1].content).toBe('Signal 2');
        }, TEST_TIMEOUT);

        it('should handle empty queue', async () => {
            await fetcher.start();
            await waitForQueueProcessing();
            
            const emitSpy = jest.spyOn(fetcher, 'emit');
            expect(emitSpy).not.toHaveBeenCalledWith('signal', expect.anything());
        }, TEST_TIMEOUT);
    });
}); 