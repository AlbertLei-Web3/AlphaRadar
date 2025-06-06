// Signal Filter Module
// 信号过滤器模块

import { EventEmitter } from 'events';
import { ParsedSignal } from './parser';

// Filter rule interface
// 过滤规则接口
export interface FilterRule {
    name: string;           // Rule name / 规则名称
    description: string;    // Rule description / 规则描述
    condition: (signal: ParsedSignal) => boolean; // Filter condition / 过滤条件
    priority: number;       // Rule priority / 规则优先级
}

// Signal Filter class
// 信号过滤器类
export class SignalFilter extends EventEmitter {
    private rules: FilterRule[] = [];

    // Add a filter rule
    // 添加过滤规则
    public addRule(rule: FilterRule): void {
        this.rules.push(rule);
        // Sort rules by priority
        // 按优先级排序规则
        this.rules.sort((a, b) => b.priority - a.priority);
    }

    // Apply all filter rules
    // 应用所有过滤规则
    public async filterSignal(signal: ParsedSignal): Promise<boolean> {
        try {
            // Apply each rule in order of priority
            // 按优先级顺序应用每个规则
            for (const rule of this.rules) {
                const passed = rule.condition(signal);
                
                // Emit rule result
                // 发出规则结果
                this.emit('ruleResult', {
                    signal,
                    rule: rule.name,
                    passed
                });

                if (!passed) {
                    console.log(`Signal filtered out by rule: ${rule.name}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error filtering signal:', error);
            return false;
        }
    }

    // Get all rules
    // 获取所有规则
    public getRules(): FilterRule[] {
        return [...this.rules];
    }

    // Remove a rule
    // 移除规则
    public removeRule(ruleName: string): void {
        this.rules = this.rules.filter(rule => rule.name !== ruleName);
    }
}

// Default filter rules
// 默认过滤规则
export const defaultFilterRules: FilterRule[] = [
    {
        name: 'MinimumPrice',
        description: 'Filter signals with price below minimum threshold',
        condition: (signal) => (signal.data.price || 0) >= 0.1,
        priority: 100
    },
    {
        name: 'MinimumVolume',
        description: 'Filter signals with volume below minimum threshold',
        condition: (signal) => (signal.data.volume || 0) >= 1000,
        priority: 90
    },
    {
        name: 'MinimumSocialMentions',
        description: 'Filter signals with low social media mentions',
        condition: (signal) => (signal.data.socialMentions || 0) >= 50,
        priority: 80
    },
    {
        name: 'ValidTokenAddress',
        description: 'Filter signals with invalid token addresses',
        condition: (signal) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(signal.tokenAddress),
        priority: 1000
    }
]; 