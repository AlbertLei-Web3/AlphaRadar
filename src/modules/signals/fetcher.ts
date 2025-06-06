// Signal Fetcher Module
// 信号抓取器模块

import { EventEmitter } from 'events';
import { Telegraf } from 'telegraf';
import { RawSignal } from './types';

// Log levels
// 日志级别
enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    ERROR = 'ERROR'
}

// Logger class
// 日志类
class Logger {
    private static instance: Logger;
    private debugEnabled: boolean;

    private constructor() {
        this.debugEnabled = process.env.DEBUG === 'true';
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }

    debug(message: string, data?: any): void {
        if (this.debugEnabled) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, data));
        }
    }

    info(message: string, data?: any): void {
        console.log(this.formatMessage(LogLevel.INFO, message, data));
    }

    error(message: string, error?: any): void {
        console.error(this.formatMessage(LogLevel.ERROR, message, error));
    }
}

// Signal interface
// 信号接口
export interface RawSignal {
    source: string;          // Signal source / 信号来源
    content: string;         // Raw content / 原始内容
    timestamp: number;       // Timestamp / 时间戳
    metadata?: Record<string, any>; // Additional metadata / 额外元数据
}

// Signal Fetcher class
// 信号抓取器类
export class SignalFetcher extends EventEmitter {
    private telegramBot: Telegraf;
    private messageQueue: RawSignal[] = [];
    private isRunning: boolean = false;
    private logger: Logger;

    constructor() {
        super();
        this.logger = Logger.getInstance();
        this.telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
        this.setupTelegramHandlers();
    }

    // Start fetching signals
    // 开始抓取信号
    public async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.info('Signal Fetcher already running');
            return;
        }
        
        try {
            this.logger.info('Starting Signal Fetcher');
            await this.telegramBot.launch();
            this.isRunning = true;
            this.processQueue();
        } catch (error) {
            this.logger.error('Error starting Signal Fetcher', error);
            throw error;
        }
    }

    // Stop fetching signals
    // 停止抓取信号
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            this.logger.info('Signal Fetcher not running');
            return;
        }
        
        try {
            this.logger.info('Stopping Signal Fetcher');
            await this.telegramBot.stop();
            this.isRunning = false;
        } catch (error) {
            this.logger.error('Error stopping Signal Fetcher', error);
            throw error;
        }
    }

    // Setup Telegram message handlers
    // 设置Telegram消息处理器
    private setupTelegramHandlers(): void {
        this.logger.debug('Setting up Telegram handlers');
        this.telegramBot.on('message', async (ctx) => {
            try {
                this.logger.debug('Telegram message received', {
                    message: ctx.message,
                    chat: ctx.chat,
                    from: ctx.from
                });

                if (
                    ctx.message &&
                    'text' in ctx.message &&
                    ctx.chat &&
                    'id' in ctx.chat &&
                    'message_id' in ctx.message &&
                    ctx.from &&
                    'id' in ctx.from
                ) {
                    this.logger.debug('Message validation passed');
                    const signal: RawSignal = {
                        source: 'telegram',
                        content: ctx.message.text,
                        timestamp: Date.now(),
                        metadata: {
                            chatId: ctx.chat.id,
                            messageId: ctx.message.message_id,
                            from: ctx.from
                        }
                    };
                    this.logger.debug('Created signal', { signal });
                    this.messageQueue.push(signal);
                    this.logger.debug('Signal pushed to queue');
                    this.emit('newSignal', signal);
                    this.logger.debug('Emitted newSignal event');
                } else {
                    this.logger.debug('Message validation failed', {
                        hasMessage: !!ctx.message,
                        hasText: ctx.message && 'text' in ctx.message,
                        hasChat: !!ctx.chat,
                        hasChatId: ctx.chat && 'id' in ctx.chat,
                        hasMessageId: ctx.message && 'message_id' in ctx.message,
                        hasFrom: !!ctx.from,
                        hasFromId: ctx.from && 'id' in ctx.from
                    });
                }
            } catch (error) {
                this.logger.error('Error processing Telegram message', error);
            }
        });
    }

    // Process message queue
    // 处理消息队列
    private async processQueue(): Promise<void> {
        while (this.isRunning && this.messageQueue.length > 0) {
            const signal = this.messageQueue.shift();
            if (signal) {
                try {
                    this.logger.debug('Processing signal', { signal });
                    this.emit('signal', signal);
                } catch (error) {
                    this.logger.error('Error processing signal', error);
                }
            }
        }
    }

    // Add signal manually (for testing or other sources)
    // 手动添加信号（用于测试或其他来源）
    public addSignal(signal: RawSignal): void {
        this.logger.debug('Adding signal', { signal });
        this.messageQueue.push(signal);
        this.emit('newSignal', signal);
    }

    // Reset method for testing
    // 重置方法用于测试
    async reset(): Promise<void> {
        this.logger.debug('Resetting Signal Fetcher');
        await this.stop();
        this.messageQueue = [];
        this.removeAllListeners();
        this.setupTelegramHandlers();
    }
} 