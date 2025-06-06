// Logger Utility
// 日志工具

// Log levels
// 日志级别
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    ERROR = 'ERROR'
}

// Logger class
// 日志类
export class Logger {
    private static instance: Logger;
    private debugEnabled: boolean;

    private constructor() {
        // Enable debug logs in development
        // 在开发环境启用调试日志
        this.debugEnabled = process.env.NODE_ENV === 'development';
    }

    // Get singleton instance
    // 获取单例实例
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    // Format log message
    // 格式化日志消息
    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }

    // Debug log
    // 调试日志
    public debug(message: string, data?: any): void {
        if (this.debugEnabled) {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
        }
    }

    // Info log
    // 信息日志
    public info(message: string, data?: any): void {
        console.info(this.formatMessage(LogLevel.INFO, message, data));
    }

    // Error log
    // 错误日志
    public error(message: string, error?: Error, data?: any): void {
        const errorData = {
            ...data,
            error: error ? {
                message: error.message,
                stack: error.stack
            } : undefined
        };
        console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
    }

    // Enable/disable debug logs
    // 启用/禁用调试日志
    public setDebugEnabled(enabled: boolean): void {
        this.debugEnabled = enabled;
    }
}

// Export singleton instance
// 导出单例实例
export const logger = Logger.getInstance(); 