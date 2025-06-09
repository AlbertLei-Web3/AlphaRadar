import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { Signal } from '../../../common/types';
import { GMGNSignalType } from '../../types/signal';
import { logger } from '../../utils/logger';

/**
 * Telegram User Source
 * Uses Telegram User API to monitor group messages
 * Telegram用户源
 * 使用Telegram用户API监控群组消息
 */
export class TelegramUserSource {
    private client: TelegramClient;
    private session: StringSession;
    private isReady: boolean = false;
    private targetUsernames: string[];

    constructor(config: {
        apiId: number;
        apiHash: string;
        sessionString?: string;
        targetUsernames: string[];
    }) {
        this.session = new StringSession(config.sessionString || '');
        this.client = new TelegramClient(
            this.session,
            config.apiId,
            config.apiHash,
            { connectionRetries: 5 }
        );
        this.targetUsernames = config.targetUsernames;
    }

    /**
     * Initialize the Telegram client
     * 初始化Telegram客户端
     */
    async initialize(): Promise<void> {
        try {
            await this.client.connect();
            if (!await this.client.isUserAuthorized()) {
                throw new Error('User not authorized. Please login first.');
            }
            this.isReady = true;
            logger.info('Telegram user client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Telegram user client:', error);
            throw error;
        }
    }

    /**
     * Start monitoring target groups
     * 开始监控目标群组
     */
    async startMonitoring(callback: (signal: Signal) => void): Promise<void> {
        if (!this.isReady) {
            throw new Error('Client not initialized');
        }

        // Add message handler for each target group
        // 为每个目标群组添加消息处理器
        for (const username of this.targetUsernames) {
            this.client.addEventHandler(
                async (event: NewMessage.Event) => {
                    try {
                        const message = event.message;
                        const chat = await event.message.getChat();
                        
                        // Check if message is from target group
                        // 检查消息是否来自目标群组
                        if (chat.username === username) {
                            const signal = await this.processMessage(message);
                            if (signal) {
                                callback(signal);
                            }
                        }
                    } catch (error) {
                        logger.error('Error processing message:', error);
                    }
                },
                new NewMessage({})
            );
        }

        logger.info(`Started monitoring groups: ${this.targetUsernames.join(', ')}`);
    }

    /**
     * Process incoming message into signal
     * 将传入消息处理为信号
     */
    private async processMessage(message: any): Promise<Signal | null> {
        try {
            const text = message.text;
            if (!text) return null;

            // Extract signal type and data
            // 提取信号类型和数据
            const signalType = this.detectSignalType(text);
            if (!signalType) return null;

            return {
                id: message.id.toString(),
                content: text,
                source: 'telegram',
                timestamp: message.date,
                signalType,
                metadata: {
                    type: 'mention',
                    confidence: this.calculateConfidence(text),
                    signalData: this.extractSignalData(text)
                }
            };
        } catch (error) {
            logger.error('Error processing message:', error);
            return null;
        }
    }

    /**
     * Detect signal type from message text
     * 从消息文本检测信号类型
     */
    private detectSignalType(text: string): GMGNSignalType | null {
        const patterns = {
            [GMGNSignalType.CTO]: /CTO Signal/i,
            [GMGNSignalType.SMART_MONEY_FOMO]: /Smart Money FOMO/i,
            [GMGNSignalType.HEAVY_BUY]: /Heavy Buy/i,
            // Add more patterns as needed
            // 根据需要添加更多模式
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return type as GMGNSignalType;
            }
        }

        return null;
    }

    /**
     * Calculate signal confidence
     * 计算信号置信度
     */
    private calculateConfidence(text: string): number {
        // Implement confidence calculation logic
        // 实现置信度计算逻辑
        return 0.8;
    }

    /**
     * Extract additional signal data
     * 提取额外的信号数据
     */
    private extractSignalData(text: string): any {
        // Implement data extraction logic
        // 实现数据提取逻辑
        return {};
    }

    /**
     * Cleanup resources
     * 清理资源
     */
    async cleanup(): Promise<void> {
        if (this.isReady) {
            await this.client.disconnect();
            this.isReady = false;
        }
    }

    /**
     * Check if client is ready
     * 检查客户端是否就绪
     */
    isReady(): boolean {
        return this.isReady;
    }
} 