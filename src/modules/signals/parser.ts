// Signal Parser Module
// 信号解析器模块

import { EventEmitter } from 'events';
import { RawSignal } from './fetcher';

// Parsed signal interface
// 解析后的信号接口
export interface ParsedSignal {
    type: string;            // Signal type / 信号类型
    tokenAddress: string;    // Token address / 代币地址
    timestamp: number;       // Timestamp / 时间戳
    source: string;          // Signal source / 信号来源
    data: {
        price?: number;      // Token price / 代币价格
        volume?: number;     // Trading volume / 交易量
        socialMentions?: number; // Social media mentions / 社交媒体提及数
        [key: string]: any;  // Additional data / 额外数据
    };
    metadata?: Record<string, any>; // Original metadata / 原始元数据
}

// Signal Parser class
// 信号解析器类
export class SignalParser extends EventEmitter {
    // Parse raw signal
    // 解析原始信号
    public parseSignal(rawSignal: RawSignal): ParsedSignal | null {
        try {
            const { content, source, timestamp, metadata } = rawSignal;
            
            // Extract signal type
            // 提取信号类型
            const type = this.extractSignalType(content);
            if (!type) return null;

            // Extract token address
            // 提取代币地址
            const tokenAddress = this.extractTokenAddress(content);
            if (!tokenAddress) return null;

            // Extract additional data
            // 提取额外数据
            const data = this.extractData(content);

            return {
                type,
                tokenAddress,
                timestamp,
                source,
                data,
                metadata
            };
        } catch (error) {
            console.error('Error parsing signal:', error);
            return null;
        }
    }

    // Extract signal type from content
    // 从内容中提取信号类型
    private extractSignalType(content: string): string | null {
        const signalTypes = [
            'CTO',
            'SOCIAL_UPDATE',
            'PUMP_SOCIAL',
            'PUMP_FDV',
            'SOL_FDV',
            'SMART_MONEY',
            'KOL_FOMO',
            'DEV_BURN',
            'ATH_PRICE',
            'HEAVY_BOUGHT',
            'SNIPER_NEW'
        ];

        for (const type of signalTypes) {
            if (content.toLowerCase().includes(type.toLowerCase())) {
                return type;
            }
        }

        return null;
    }

    // Extract token address from content
    // 从内容中提取代币地址
    private extractTokenAddress(content: string): string | null {
        // Match Solana address pattern
        // 匹配Solana地址模式
        const addressMatch = content.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
        return addressMatch ? addressMatch[0] : null;
    }

    // Extract additional data from content
    // 从内容中提取额外数据
    private extractData(content: string): Record<string, any> {
        const data: Record<string, any> = {};

        // Extract price
        // 提取价格
        const priceMatch = content.match(/\$(\d+\.?\d*)/);
        if (priceMatch) {
            data.price = parseFloat(priceMatch[1]);
        }

        // Extract volume
        // 提取交易量
        const volumeMatch = content.match(/volume:?\s*\$?(\d+\.?\d*)/i);
        if (volumeMatch) {
            data.volume = parseFloat(volumeMatch[1]);
        }

        // Extract social mentions
        // 提取社交媒体提及数
        const mentionsMatch = content.match(/mentions:?\s*(\d+)/i);
        if (mentionsMatch) {
            data.socialMentions = parseInt(mentionsMatch[1]);
        }

        return data;
    }
} 