import { TelegramSource } from '../modules/signals/evaluator/sources/telegram';
import { SignalEvaluator } from '../modules/signals/evaluator/core/evaluator';
import { GMGNSignalType } from '../modules/signals/evaluator/types/signal';
import dotenv from 'dotenv';

// Load environment variables
// 加载环境变量
dotenv.config();

/**
 * Real World Interaction Example
 * Demonstrates interaction with Telegram and GMGN
 * 真实世界交互示例
 * 展示与Telegram和GMGN的交互
 */
async function runRealWorldInteraction() {
    try {
        console.log('🚀 Starting real-world interaction...');

        // 1. Initialize Telegram Source
        // 初始化Telegram源
        console.log('📱 Initializing Telegram source...');
        const telegramConfig = {
            name: 'real-world-telegram',
            weight: 0.5,
            timeWindow: 60,
            enabled: true,
            apiToken: process.env.TELEGRAM_BOT_TOKEN!,
            targetIds: [process.env.TELEGRAM_CHAT_ID!],
            cacheSize: 100
        };
        const telegramSource = new TelegramSource(telegramConfig);
        await telegramSource.initialize();
        console.log('✅ Telegram source initialized');

        // 2. Initialize Signal Evaluator
        // 初始化信号评估器
        console.log('⚙️ Initializing signal evaluator...');
        const evaluatorConfig = {
            name: 'real-world-evaluator',
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

        // 3. Start listening for signals
        // 开始监听信号
        console.log('👂 Listening for signals...');
        telegramSource.on('signal', async (signal) => {
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
        console.log('⏳ Waiting for signals...');
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down...');
            await telegramSource.cleanup();
            await evaluator.cleanup();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error in real-world interaction:', error);
        process.exit(1);
    }
}

// Run the example
// 运行示例
runRealWorldInteraction().catch(console.error); 