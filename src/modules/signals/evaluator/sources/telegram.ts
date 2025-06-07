// Telegram sentiment data source implementation
// Telegram舆情数据源实现

import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { SentimentSource, SourceConfig } from './base';
import { SentimentData, TelegramMention } from '../types/signal';
import { logger } from '../utils/logger';
import { GMGNSignalType } from '../types/signal';

// Telegram source configuration
// Telegram数据源配置
interface TelegramConfig extends SourceConfig {
    // Telegram API token
    // Telegram API令牌
    apiToken: string;
    
    // Target group/channel IDs
    // 目标群组/频道ID
    targetIds: string[];
    
    // Message cache size
    // 消息缓存大小
    cacheSize: number;
}

// Telegram sentiment source
// Telegram舆情数据源
export class TelegramSource implements SentimentSource {
    private config: TelegramConfig;
    private client!: Telegraf<Context>;
    private messageCache: Map<string, TelegramMention[]>;
    private ready: boolean;

    constructor(config: TelegramConfig) {
        this.config = config;
        this.messageCache = new Map();
        this.ready = false;
    }

    // Get source configuration
    // 获取数据源配置
    getConfig(): SourceConfig {
        return this.config;
    }

    // Initialize the source
    // 初始化数据源
    async initialize(): Promise<void> {
        try {
            this.client = new Telegraf(this.config.apiToken);
            
            // Set up message handlers
            // 设置消息处理器
            this.setupMessageHandlers();
            
            // Start the bot
            // 启动机器人
            await this.client.launch();
            
            this.ready = true;
            logger.info('Telegram source initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Telegram source:', error as Error);
            throw error;
        }
    }

    // Set up message handlers
    // 设置消息处理器
    private setupMessageHandlers(): void {
        this.client.on('message', async (ctx) => {
            try {
                const message = ctx.message as Message.TextMessage;
                if (!message?.text) return;

                // Process message and update cache
                // 处理消息并更新缓存
                await this.processMessage(message.text, message.date);
            } catch (error) {
                logger.error('Error processing Telegram message:', error as Error);
            }
        });
    }

    // Process incoming message
    // 处理接收到的消息
    private async processMessage(text: string, timestamp: number): Promise<void> {
        // Extract mentions from message
        // 从消息中提取提及
        const mentions = this.extractMentions(text, timestamp);
        
        // Update cache for each mentioned symbol
        // 更新每个提及符号的缓存
        for (const mention of mentions) {
            const symbol = mention.symbol;
            if (!this.messageCache.has(symbol)) {
                this.messageCache.set(symbol, []);
            }
            
            const cache = this.messageCache.get(symbol)!;
            cache.push(mention);
            
            // Maintain cache size
            // 维护缓存大小
            if (cache.length > this.config.cacheSize) {
                cache.shift();
            }
        }
    }

    // Extract mentions from message text
    // 从消息文本中提取提及
    private extractMentions(text: string, timestamp: number): TelegramMention[] {
        const mentions: TelegramMention[] = [];
        
        // Simple symbol detection (can be enhanced)
        // 简单的符号检测（可以增强）
        const symbolRegex = /\$[A-Z]+/g;
        const matches = text.match(symbolRegex);
        
        if (matches) {
            for (const match of matches) {
                const symbol = match.substring(1); // Remove $ prefix
                
                // Detect signal type
                // 检测信号类型
                const signalType = this.detectSignalType(text);
                
                // Extract signal-specific data
                // 提取信号特定数据
                const signalData = this.extractSignalData(text, signalType);
                
                mentions.push({
                    symbol,
                    timestamp,
                    source: 'telegram',
                    content: text,
                    signalType,
                    metadata: {
                        type: 'mention',
                        signalData
                    }
                });
            }
        }
        
        return mentions;
    }

    // Detect signal type from message text
    // 从消息文本中检测信号类型
    private detectSignalType(text: string): GMGNSignalType | undefined {
        const lowerText = text.toLowerCase();
        
        // Signal type detection patterns
        // 信号类型检测模式
        const patterns: [GMGNSignalType, string[]][] = [
            [GMGNSignalType.CTO, ['cto', 'community takeover']],
            [GMGNSignalType.UPDATE_SOCIAL, ['update social', 'social info']],
            [GMGNSignalType.PUMP_SOCIAL, ['pump social', 'pump info']],
            [GMGNSignalType.PUMP_FDV_SURGE, ['pump fdv', 'pump surge']],
            [GMGNSignalType.SOL_FDV_SURGE, ['sol fdv', 'solana surge']],
            [GMGNSignalType.SMART_MONEY_FOMO, ['smart money', 'smart fomo']],
            [GMGNSignalType.KOL_FOMO, ['kol fomo', 'kol signal']],
            [GMGNSignalType.DEV_BURN, ['dev burn', 'burn alert']],
            [GMGNSignalType.ATH_PRICE, ['ath', 'all time high']],
            [GMGNSignalType.HEAVY_BUY, ['heavy buy', 'large buy']],
            [GMGNSignalType.SNIPER_NEW, ['sniper new', 'new token']]
        ];
        
        // Check each pattern
        // 检查每个模式
        for (const [type, keywords] of patterns) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return type;
            }
        }
        
        return undefined;
    }

    // Extract signal-specific data from message text
    // 从消息文本中提取信号特定数据
    private extractSignalData(text: string, signalType?: GMGNSignalType): TelegramMention['metadata']['signalData'] {
        if (!signalType) return undefined;
        
        const data: TelegramMention['metadata']['signalData'] = {};
        
        switch (signalType) {
            case GMGNSignalType.ATH_PRICE:
                // Extract price data
                // 提取价格数据
                const priceMatch = text.match(/\$(\d+(\.\d+)?)/);
                if (priceMatch) {
                    data.price = parseFloat(priceMatch[1]);
                }
                break;
                
            case GMGNSignalType.HEAVY_BUY:
                // Extract volume data
                // 提取成交量数据
                const volumeMatch = text.match(/(\d+(\.\d+)?)\s*(ETH|BNB|SOL)/i);
                if (volumeMatch) {
                    data.volume = parseFloat(volumeMatch[1]);
                }
                break;
                
            case GMGNSignalType.DEV_BURN:
                // Extract burn amount
                // 提取烧毁数量
                const burnMatch = text.match(/(\d+(\.\d+)?)\s*(ETH|BNB|SOL)/i);
                if (burnMatch) {
                    data.burnAmount = parseFloat(burnMatch[1]);
                }
                break;
                
            case GMGNSignalType.PUMP_FDV_SURGE:
            case GMGNSignalType.SOL_FDV_SURGE:
                // Extract FDV data
                // 提取FDV数据
                const fdvMatch = text.match(/(\d+(\.\d+)?)\s*(M|B)/i);
                if (fdvMatch) {
                    const value = parseFloat(fdvMatch[1]);
                    const unit = fdvMatch[3].toUpperCase();
                    data.fdv = unit === 'B' ? value * 1000 : value;
                }
                break;
                
            case GMGNSignalType.UPDATE_SOCIAL:
            case GMGNSignalType.PUMP_SOCIAL:
                // Extract social update status
                // 提取社交更新状态
                data.socialUpdate = {
                    twitter: text.toLowerCase().includes('twitter'),
                    telegram: text.toLowerCase().includes('telegram'),
                    website: text.toLowerCase().includes('website')
                };
                break;
        }
        
        return data;
    }

    // Get sentiment data for a symbol
    // 获取符号的舆情数据
    async getSentimentData(symbol: string): Promise<SentimentData> {
        if (!this.ready) {
            throw new Error('Telegram source not initialized');
        }

        const mentions = this.messageCache.get(symbol) || [];
        const now = Math.floor(Date.now() / 1000);
        const timeWindow = this.config.timeWindow * 60; // Convert to seconds

        // Filter mentions within time window
        // 过滤时间窗口内的提及
        const recentMentions = mentions.filter(
            mention => now - mention.timestamp <= timeWindow
        );

        // Calculate sentiment score
        // 计算舆情分数
        const score = this.calculateSentimentScore(recentMentions);

        return {
            symbol,
            score,
            sourceWeight: this.config.weight, // Add source weight from config
            timestamp: now,
            source: 'telegram',
            metadata: {
                mentionCount: recentMentions.length,
                timeWindow: this.config.timeWindow
            }
        };
    }

    // Calculate sentiment score from mentions
    // 从提及计算舆情分数
    private calculateSentimentScore(mentions: TelegramMention[]): number {
        if (mentions.length === 0) return 0;

        // Base score from mention frequency
        // 基于提及频率的基础分数
        const baseScore = Math.min(mentions.length * 10, 100);
        
        // Signal type multiplier
        // 信号类型乘数
        const signalMultiplier = mentions.reduce((sum, mention) => {
            if (!mention.signalType) return sum + 1;
            
            // Different weights for different signal types
            // 不同信号类型的不同权重
            const weights: Record<GMGNSignalType, number> = {
                [GMGNSignalType.CTO]: 1.5,
                [GMGNSignalType.UPDATE_SOCIAL]: 1.2,
                [GMGNSignalType.PUMP_SOCIAL]: 1.3,
                [GMGNSignalType.PUMP_FDV_SURGE]: 1.4,
                [GMGNSignalType.SOL_FDV_SURGE]: 1.4,
                [GMGNSignalType.SMART_MONEY_FOMO]: 1.6,
                [GMGNSignalType.KOL_FOMO]: 1.5,
                [GMGNSignalType.DEV_BURN]: 1.3,
                [GMGNSignalType.ATH_PRICE]: 1.4,
                [GMGNSignalType.HEAVY_BUY]: 1.5,
                [GMGNSignalType.SNIPER_NEW]: 1.2
            };
            
            return sum + (weights[mention.signalType] || 1);
        }, 0) / mentions.length;
        
        // Apply time decay
        // 应用时间衰减
        const now = Math.floor(Date.now() / 1000);
        const timeDecay = mentions.reduce((sum, mention) => {
            const age = now - mention.timestamp;
            return sum + Math.exp(-age / 3600); // 1-hour decay
        }, 0) / mentions.length;

        return Math.round(baseScore * signalMultiplier * timeDecay);
    }

    // Check if source is ready
    // 检查数据源是否就绪
    isReady(): boolean {
        return this.ready;
    }

    // Cleanup resources
    // 清理资源
    async cleanup(): Promise<void> {
        if (this.client) {
            await this.client.stop();
        }
        this.ready = false;
        this.messageCache.clear();
    }
} 