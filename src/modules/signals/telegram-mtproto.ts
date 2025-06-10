import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { EventEmitter } from 'events';
import { logger } from '../common/utils/logger';
import { NewMessage } from 'telegram/events';
import { Api } from 'telegram/tl';

/**
 * Telegram Client Configuration
 * Telegram 客户端配置
 */
interface TelegramConfig {
    apiId: number;
    apiHash: string;
    sessionString: string;
    targetGroups: string[];
    checkInterval: number;
}

/**
 * Telegram Client
 * Handles connection and message monitoring
 * Telegram 客户端
 * 处理连接和消息监控
 */
export class TelegramMTProtoClient extends EventEmitter {
    private client: TelegramClient;
    private config: TelegramConfig;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor(config: TelegramConfig) {
        super();
        this.config = config;
        this.initializeClient();
    }

    /**
     * Initialize Telegram client
     * 初始化 Telegram 客户端
     */
    private initializeClient() {
        try {
            const stringSession = new StringSession(this.config.sessionString);
            this.client = new TelegramClient(
                stringSession,
                this.config.apiId,
                this.config.apiHash,
                {
                    connectionRetries: 5,
                    useWSS: true
                }
            );

            this.setupEventListeners();
            logger.info('Telegram client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Telegram client:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for the client
     * 设置客户端的事件监听器
     */
    private setupEventListeners() {
        this.client.addEventHandler(async (event: NewMessage.Event) => {
            try {
                const message = event.message;
                if (!message.message) return;

                // Check for signal patterns
                // 检查信号模式
                const signalPatterns = [
                    /GMGN/i,
                    /signal/i,
                    /alert/i,
                    /buy/i,
                    /sell/i
                ];

                const hasSignal = signalPatterns.some(pattern => 
                    pattern.test(message.message)
                );

                if (hasSignal) {
                    this.emit('signal', {
                        type: 'telegram',
                        source: 'telegram',
                        message: message.message,
                        timestamp: message.date,
                        groupId: message.peerId.channelId
                    });
                }
            } catch (error) {
                logger.error('Error processing message:', error);
            }
        }, new NewMessage({}));

        this.client.addEventHandler((error: any) => {
            logger.error('Telegram client error:', error);
            this.handleConnectionError();
        });
    }

    /**
     * Handle connection errors and attempt reconnection
     * 处理连接错误并尝试重连
     */
    private async handleConnectionError() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            await this.connect();
        } else {
            logger.error('Max reconnection attempts reached');
            this.emit('error', new Error('Max reconnection attempts reached'));
        }
    }

    /**
     * Connect to Telegram servers
     * 连接到 Telegram 服务器
     */
    public async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.info('Connected to Telegram servers');

            // Join target groups
            // 加入目标群组
            for (const groupId of this.config.targetGroups) {
                try {
                    const entity = await this.client.getEntity(groupId);
                    logger.info(`Monitoring group: ${entity.title}`);
                } catch (error) {
                    logger.error(`Failed to monitor group ${groupId}:`, error);
                }
            }
        } catch (error) {
            logger.error('Failed to connect to Telegram servers:', error);
            throw error;
        }
    }

    /**
     * Disconnect from Telegram servers
     * 断开与 Telegram 服务器的连接
     */
    public async disconnect(): Promise<void> {
        try {
            await this.client.disconnect();
            this.isConnected = false;
            logger.info('Disconnected from Telegram servers');
        } catch (error) {
            logger.error('Error disconnecting from Telegram servers:', error);
            throw error;
        }
    }
} 