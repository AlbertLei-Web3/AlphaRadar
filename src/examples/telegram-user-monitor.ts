import { TelegramUserSource } from '../modules/signals/evaluator/sources/telegram-user';
import { SignalEvaluator } from '../modules/signals/evaluator/core/evaluator';
import { GMGNSignalType } from '../modules/signals/evaluator/types/signal';
import dotenv from 'dotenv';

// Load environment variables
// 加载环境变量
dotenv.config();

/**
 * Telegram User Monitor Example
 * Demonstrates monitoring Telegram groups using user API
 * Telegram用户监控示例
 * 展示使用用户API监控Telegram群组
 */
async function runTelegramUserMonitor() {
    try {
        console.log('🚀 Starting Telegram user monitor...');

        // 1. Initialize Telegram User Source
        // 初始化Telegram用户源
        console.log('📱 Initializing Telegram user source...');
        const telegramConfig = {
            apiId: parseInt(process.env.TELEGRAM_API_ID!),
            apiHash: process.env.TELEGRAM_API_HASH!,
            targetUsernames: process.env.TELEGRAM_TARGET_GROUPS!.split(',')
        };
        const telegramSource = new TelegramUserSource(telegramConfig);
        await telegramSource.initialize();
        console.log('✅ Telegram user source initialized');

        // 2. Initialize Signal Evaluator
        // 初始化信号评估器
        console.log('⚙️ Initializing signal evaluator...');
        const evaluatorConfig = {
            name: 'telegram-user-evaluator',
            weight: 0.5,
            timeWindow: 60,
            enabled: true,
            sources: ['telegram'],
            minScore: 50,
            maxScore: 100
        };
        const evaluator = new SignalEvaluator(evaluatorConfig);
        await evaluator.initialize();
        console.log('✅ Signal evaluator initialized');

        // 3. Start monitoring groups
        // 开始监控群组
        console.log('👂 Starting group monitoring...');
        await telegramSource.startMonitoring(async (signal) => {
            console.log('📥 Received signal:', signal);

            // Process the signal
            // 处理信号
            const result = await evaluator.processSignal(signal);
            console.log('📊 Signal evaluation result:', {
                score: result.score,
                type: result.metadata.signalType,
                confidence: result.metadata.confidence
            });

            // Take action based on signal type
            // 根据信号类型采取行动
            switch (result.metadata.signalType) {
                case GMGNSignalType.CTO:
                    console.log('🚨 CTO Signal detected!');
                    // Add your CTO signal handling logic here
                    // 在这里添加CTO信号处理逻辑
                    break;

                case GMGNSignalType.SMART_MONEY_FOMO:
                    console.log('💰 Smart Money FOMO detected!');
                    // Add your FOMO signal handling logic here
                    // 在这里添加FOMO信号处理逻辑
                    break;

                case GMGNSignalType.HEAVY_BUY:
                    console.log('💎 Heavy Buy detected!');
                    // Add your heavy buy handling logic here
                    // 在这里添加大额买入处理逻辑
                    break;

                default:
                    console.log('📝 Other signal type detected');
            }
        });

        // 4. Keep the process running
        // 保持进程运行
        console.log('⏳ Monitoring groups...');
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down...');
            await telegramSource.cleanup();
            await evaluator.cleanup();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error in Telegram user monitor:', error);
        process.exit(1);
    }
}

// Run the example
// 运行示例
runTelegramUserMonitor().catch(console.error); 