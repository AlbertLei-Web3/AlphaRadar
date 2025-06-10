import { TelegramMTProtoClient } from '../modules/signals/telegram-mtproto';
import dotenv from 'dotenv';

// Load environment variables
// 加载环境变量
dotenv.config();

/**
 * Telegram MTProto Example
 * Demonstrates monitoring Telegram groups using MTProto
 * Telegram MTProto 示例
 * 展示使用 MTProto 监控 Telegram 群组
 */
async function runTelegramMTProtoExample() {
    try {
        console.log('🚀 Starting Telegram MTProto monitor...');

        // 1. Initialize MTProto Client
        // 初始化 MTProto 客户端
        console.log('📱 Initializing MTProto client...');
        const mtprotoConfig = {
            server: {
                ip: '149.154.167.50',
                port: 443,
                publicKey: 'MIIBCgKCAQEA6LszBcC1LGzyr992NzE0ieY+BSaOW622Aa9Bd4ZHLl+TuFQ4lo4g5nKaMBwK/BIb9xUfg0Q29/2mgIR6Zr9krM7HjuIcCzFvDtr+L0GQjae9H0pRB2OO62cECs5HKhT5DZ98K33vmWiLowc621dQuwKWSQKjWf50XYFw42h21P2KXUGyp2y/+aEyZ+uVgLLQbRA1dEjSDZ2iGRy12Mk5gpYc397aYp438fsJoHIgJ2lgMv5h7WY9t6N/byY9Nw9p21Og3AoXSL2q/2IJ1WRUhebgAdGVMlV1fkuOQoEzR7EdpqtQD9Cs5+bfo3Nhmcyvk5ftB0WkJ9z6bNZ7yxrP8wIDAQAB'
            },
            targetGroups: process.env.TELEGRAM_TARGET_GROUPS!.split(','),
            checkInterval: 30000 // 30 seconds
        };

        const mtprotoClient = new TelegramMTProtoClient(mtprotoConfig);

        // 2. Set up event listeners
        // 设置事件监听器
        mtprotoClient.on('signal', (signal) => {
            console.log('📥 Received signal:', signal);
            // Process the signal here
            // 在这里处理信号
        });

        mtprotoClient.on('error', (error) => {
            console.error('❌ Error:', error);
        });

        // 3. Connect and start monitoring
        // 连接并开始监控
        console.log('🔌 Connecting to Telegram servers...');
        await mtprotoClient.connect();

        // 4. Keep the process running
        // 保持进程运行
        console.log('⏳ Monitoring groups...');
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down...');
            await mtprotoClient.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error in Telegram MTProto example:', error);
        process.exit(1);
    }
}

// Run the example
// 运行示例
runTelegramMTProtoExample().catch(console.error); 