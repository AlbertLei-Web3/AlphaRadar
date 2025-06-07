// Base interface for sentiment data sources
// 舆情数据源的基础接口

import { SentimentData } from '../types/signal';

// Source configuration interface
// 数据源配置接口
export interface SourceConfig {
    // Source name
    // 数据源名称
    name: string;
    
    // Source weight in final score (0-1)
    // 在最终分数中的权重（0-1）
    weight: number;
    
    // Time window for data collection (in minutes)
    // 数据收集的时间窗口（分钟）
    timeWindow: number;
    
    // Whether this source is enabled
    // 是否启用此数据源
    enabled: boolean;
}

// Base source interface
// 基础数据源接口
export interface SentimentSource {
    // Get source configuration
    // 获取数据源配置
    getConfig(): SourceConfig;
    
    // Initialize the source
    // 初始化数据源
    initialize(): Promise<void>;
    
    // Get sentiment data
    // 获取舆情数据
    getSentimentData(symbol: string): Promise<SentimentData>;
    
    // Check if source is ready
    // 检查数据源是否就绪
    isReady(): boolean;
    
    // Cleanup resources
    // 清理资源
    cleanup(): Promise<void>;
} 