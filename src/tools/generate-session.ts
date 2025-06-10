import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import readline from 'readline';

/**
 * Generate Telegram Session String
 * 生成 Telegram 会话字符串
 */
async function generateSession() {
    try {
        console.log('🚀 Starting session generation...');

        // Create readline interface for user input
        // 创建 readline 接口用于用户输入
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Get phone number
        // 获取电话号码
        const phoneNumber = await new Promise<string>((resolve) => {
            rl.question('📱 Please enter your phone number (with country code, e.g., +1234567890): ', (answer) => {
                resolve(answer);
            });
        });

        // Initialize client with minimal settings
        // 使用最小设置初始化客户端
        const client = new TelegramClient(
            new StringSession(''), // Empty session
            27321288, // Your API ID
            '5c3202e68b0b9d356e7fc7daaec65e90', // Your API Hash
            {
                connectionRetries: 5,
                useWSS: false, // Use TCP instead of WebSocket
                timeout: 30000 // Increase timeout to 30 seconds
            }
        );

        // Connect to Telegram
        // 连接到 Telegram
        console.log('🔌 Connecting to Telegram...');
        await client.connect();

        // Send code request
        // 发送验证码请求
        console.log('📤 Sending code request...');
        const { phoneCodeHash } = await client.sendCode({
            apiId: 27321288,
            apiHash: '5c3202e68b0b9d356e7fc7daaec65e90',
            phoneNumber
        });

        // Get verification code
        // 获取验证码
        const code = await new Promise<string>((resolve) => {
            rl.question('🔑 Please enter the verification code you received: ', (answer) => {
                resolve(answer);
            });
        });

        // Sign in
        // 登录
        console.log('🔐 Signing in...');
        await client.signIn({
            phoneNumber,
            phoneCodeHash,
            phoneCode: code
        });

        // Get session string
        // 获取会话字符串
        const sessionString = client.session.save();
        console.log('\n✅ Session string generated successfully!');
        console.log('\n📋 Your session string:');
        console.log(sessionString);
        console.log('\n💡 Add this to your .env file as TELEGRAM_SESSION_STRING');

        // Disconnect
        // 断开连接
        await client.disconnect();
        rl.close();

    } catch (error) {
        console.error('❌ Error generating session:', error);
        process.exit(1);
    }
}

// Run the generator
// 运行生成器
generateSession().catch(console.error); 