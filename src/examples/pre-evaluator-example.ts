import { SignalPreEvaluator } from '../modules/signals/evaluator';
import { defaultPreEvaluatorConfig } from '../config/pre-evaluator';

// Example of how to use the signal pre-evaluator
// 信号预评估器使用示例
async function main() {
    // Create pre-evaluator instance
    // 创建预评估器实例
    const evaluator = new SignalPreEvaluator(defaultPreEvaluatorConfig);

    // Listen for evaluation results
    // 监听评估结果
    evaluator.on('evaluation', (result) => {
        console.log('Signal evaluation result:', {
            signal: result.signal,
            score: result.score,
            passed: result.passed
        });
    });

    // Example signal
    // 示例信号
    const exampleSignal = {
        tokenAddress: '0x123...',
        type: 'SNIPER_NEW',
        timestamp: Date.now(),
        data: {
            price: 0.1,
            volume: 1000,
            socialMentions: 100
        }
    };

    try {
        // Evaluate the signal
        // 评估信号
        const score = await evaluator.evaluateSignal(exampleSignal);
        console.log('Evaluation score:', score);
    } catch (error) {
        console.error('Error evaluating signal:', error);
    }
}

// Run the example
// 运行示例
main().catch(console.error); 