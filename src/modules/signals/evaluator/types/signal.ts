// Signal Types Definition
// 信号类型定义

import { SignalType } from './score';

// Base signal interface
// 基础信号接口
export interface BaseSignal {
    tokenAddress: string;      // Token contract address
    tokenSymbol: string;       // Token symbol
    timestamp: number;         // Signal timestamp
    source: string;            // Signal source
    type: SignalType;          // Signal type
    metadata: Record<string, any>; // Additional metadata
}

// Telegram mention data
// Telegram提及数据
export interface TelegramMention {
    count: number;             // Mention count
    timestamp: number;         // Mention timestamp
    groupId: string;           // Telegram group ID
    messageId: string;         // Message ID
}

// Trade data
// 交易数据
export interface TradeData {
    timestamp: number;         // Trade timestamp
    type: 'buy' | 'sell';      // Trade type
    amount: number;            // Trade amount
    price: number;             // Trade price
    txHash: string;            // Transaction hash
}

// Blacklist entry
// 黑名单条目
export interface BlacklistEntry {
    tokenAddress: string;      // Token address
    reason: string;            // Blacklist reason
    timestamp: number;         // Blacklist timestamp
    severity: 'low' | 'medium' | 'high'; // Severity level
    age: number;               // Days since blacklisted
}

// Signal evaluation input
// 信号评估输入
export interface SignalEvaluationInput {
    signal: BaseSignal;                    // Base signal
    telegramMentions: TelegramMention[];   // Telegram mentions
    trades: TradeData[];                   // Trade data
    blacklistStatus?: BlacklistEntry;      // Blacklist status
    triggeredSignals: SignalType[];        // Triggered GMGN signals
} 