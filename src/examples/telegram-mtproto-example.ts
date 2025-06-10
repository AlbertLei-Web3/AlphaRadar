import { TelegramMTProtoClient } from '../modules/signals/telegram-mtproto';
import dotenv from 'dotenv';

// Load environment variables
// 加载环境变量
dotenv.config();

/**
 * Telegram Client Example
 * Demonstrates monitoring Telegram groups
 * Telegram 客户端示例
 * 展示监控 Telegram 群组
 */
async function runTelegramExample() {
    try {
        console.log('🚀 Starting Telegram monitor...');

        // 1. Initialize Telegram Client
        // 初始化 Telegram 客户端
        console.log('📱 Initializing Telegram client...');
        const telegramConfig = {
            apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
            apiHash: process.env.TELEGRAM_API_HASH || '',
            sessionString: process.env.TELEGRAM_SESSION_STRING || '',
            targetGroups: ['gmgnsignals'],
            checkInterval: 30000 // 30 seconds
        };

        const telegramClient = new TelegramMTProtoClient(telegramConfig);

        // 2. Set up event listeners
        // 设置事件监听器
        telegramClient.on('signal', (signal) => {
            console.log('📥 Received signal:', signal);
            // Process the signal here
            // 在这里处理信号
        });

        telegramClient.on('error', (error) => {
            console.error('❌ Error:', error);
        });

        // 3. Connect and start monitoring
        // 连接并开始监控
        console.log('🔌 Connecting to Telegram servers...');
        await telegramClient.connect();

        // 4. Keep the process running
        // 保持进程运行
        console.log('⏳ Monitoring groups...');
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down...');
            await telegramClient.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error in Telegram example:', error);
        process.exit(1);
    }
}

// Run the example
// 运行示例
runTelegramExample().catch(console.error); 