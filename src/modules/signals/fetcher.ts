// Signal Fetcher Module
// 信号抓取器模块

import { EventEmitter } from 'events';
import { Telegraf } from 'telegraf';
import { config } from '../../config';

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
    private isRunning: boolean = false;
    private messageQueue: RawSignal[] = [];

    constructor() {
        super();
        this.telegramBot = new Telegraf(config.telegram.botToken);
        this.setupTelegramHandlers();
    }

    // Start fetching signals
    // 开始抓取信号
    public async start(): Promise<void> {
        if (this.isRunning) return;
        
        try {
            await this.telegramBot.launch();
            this.isRunning = true;
            console.log('Signal Fetcher started');
            
            // Start processing queue
            // 开始处理队列
            this.processQueue();
        } catch (error) {
            console.error('Error starting Signal Fetcher:', error);
            throw error;
        }
    }

    // Stop fetching signals
    // 停止抓取信号
    public async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        try {
            await this.telegramBot.stop();
            this.isRunning = false;
            console.log('Signal Fetcher stopped');
        } catch (error) {
            console.error('Error stopping Signal Fetcher:', error);
            throw error;
        }
    }

    // Setup Telegram message handlers
    // 设置Telegram消息处理器
    private setupTelegramHandlers(): void {
        this.telegramBot.on('message', async (ctx) => {
            try {
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

                // Add to queue
                // 添加到队列
                this.messageQueue.push(signal);
                
                // Emit new signal event
                // 发出新信号事件
                this.emit('newSignal', signal);
            } catch (error) {
                console.error('Error processing Telegram message:', error);
            }
        });
    }

    // Process message queue
    // 处理消息队列
    private async processQueue(): Promise<void> {
        while (this.isRunning) {
            if (this.messageQueue.length > 0) {
                const signal = this.messageQueue.shift();
                if (signal) {
                    try {
                        // Emit signal for processing
                        // 发出信号以供处理
                        this.emit('signal', signal);
                    } catch (error) {
                        console.error('Error processing signal:', error);
                    }
                }
            }
            // Wait before next iteration
            // 等待下一次迭代
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Add signal manually (for testing or other sources)
    // 手动添加信号（用于测试或其他来源）
    public addSignal(signal: RawSignal): void {
        this.messageQueue.push(signal);
        this.emit('newSignal', signal);
    }
} 