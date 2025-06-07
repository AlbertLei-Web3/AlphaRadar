// Jest configuration for TypeScript
// Jest TypeScript配置

module.exports = {
    // Specify the test environment
    // 指定测试环境
    testEnvironment: 'node',

    // Transform TypeScript files using ts-jest
    // 使用ts-jest转换TypeScript文件
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },

    // File extensions to test
    // 要测试的文件扩展名
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

    // Module file extensions
    // 模块文件扩展名
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Coverage configuration
    // 覆盖率配置
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**'
    ],

    // Setup files
    // 设置文件
    setupFiles: ['<rootDir>/jest.setup.js'],

    // Verbose output
    // 详细输出
    verbose: true
}; 