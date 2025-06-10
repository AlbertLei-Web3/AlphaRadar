import { MTProto } from 'telegram-mtproto';
import { EventEmitter } from 'events';
import { logger } from '../common/utils/logger';

/**
 * Telegram MTProto Client Configuration
 * Telegram MTProto 客户端配置
 */
interface TelegramConfig {
    server: {
        ip: string;
        port: number;
        publicKey: string;
    };
    targetGroups: string[];
    checkInterval: number;
}

/**
 * Telegram MTProto Client
 * Handles connection and message monitoring using MTProto protocol
 * Telegram MTProto 客户端
 * 使用 MTProto 协议处理连接和消息监控
 */
export class TelegramMTProtoClient extends EventEmitter {
    private client: any;
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
     * Initialize MTProto client
     * 初始化 MTProto 客户端
     */
    private initializeClient() {
        try {
            this.client = new MTProto({
                server: {
                    ip: this.config.server.ip,
                    port: this.config.server.port,
                    publicKey: this.config.server.publicKey
                }
            });

            this.setupEventListeners();
            logger.info('MTProto client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize MTProto client:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for the client
     * 设置客户端的事件监听器
     */
    private setupEventListeners() {
        this.client.on('error', (error: any) => {
            logger.error('MTProto client error:', error);
            this.handleConnectionError();
        });

        this.client.on('disconnected', () => {
            logger.warn('MTProto client disconnected');
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
            this.startMonitoring();
        } catch (error) {
            logger.error('Failed to connect to Telegram servers:', error);
            throw error;
        }
    }

    /**
     * Start monitoring target groups
     * 开始监控目标群组
     */
    private async startMonitoring() {
        if (!this.isConnected) {
            logger.error('Cannot start monitoring: Not connected');
            return;
        }

        for (const groupId of this.config.targetGroups) {
            try {
                // Get group information
                // 获取群组信息
                const groupInfo = await this.client.call('channels.getFullChannel', {
                    channel: groupId
                });

                logger.info(`Monitoring group: ${groupInfo.chats[0].title}`);

                // Start message monitoring
                // 开始消息监控
                this.monitorGroupMessages(groupId);
            } catch (error) {
                logger.error(`Failed to monitor group ${groupId}:`, error);
            }
        }
    }

    /**
     * Monitor messages in a specific group
     * 监控特定群组的消息
     */
    private async monitorGroupMessages(groupId: string) {
        try {
            // Get recent messages
            // 获取最近的消息
            const messages = await this.client.call('messages.getHistory', {
                peer: groupId,
                limit: 100
            });

            // Process messages
            // 处理消息
            for (const message of messages.messages) {
                this.processMessage(message);
            }

            // Set up periodic checking
            // 设置定期检查
            setInterval(async () => {
                try {
                    const newMessages = await this.client.call('messages.getHistory', {
                        peer: groupId,
                        limit: 10
                    });

                    for (const message of newMessages.messages) {
                        this.processMessage(message);
                    }
                } catch (error) {
                    logger.error(`Error fetching new messages for group ${groupId}:`, error);
                }
            }, this.config.checkInterval);
        } catch (error) {
            logger.error(`Failed to monitor messages for group ${groupId}:`, error);
        }
    }

    /**
     * Process a message and emit signal if found
     * 处理消息并在找到信号时发出事件
     */
    private processMessage(message: any) {
        try {
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
                    source: 'mtproto',
                    message: message.message,
                    timestamp: message.date,
                    groupId: message.peer_id.channel_id
                });
            }
        } catch (error) {
            logger.error('Error processing message:', error);
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