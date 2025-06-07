// Global test setup
// 全局测试设置

// Set test timeout
// 设置测试超时
jest.setTimeout(30000);

// Mock console methods to keep test output clean
// 模拟控制台方法以保持测试输出整洁
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
}; 