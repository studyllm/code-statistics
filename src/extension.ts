import * as vscode from 'vscode';
import { CodeAnalyzer } from './analyzer';
import { StateManager } from './stateManager';
import { UIManager } from './ui';

let analyzer: CodeAnalyzer;
let stateManager: StateManager;
let uiManager: UIManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('代码统计器插件已激活');

    // 初始化核心组件
    analyzer = new CodeAnalyzer();
    stateManager = new StateManager(context);
    uiManager = new UIManager();

    // 初始化状态栏显示
    const latestStats = stateManager.getLatestStats();
    uiManager.updateStatusBar(latestStats);

    // 注册命令：分析代码统计
    const analyzeCommand = vscode.commands.registerCommand('code-statistics.analyze', async () => {
        try {
            const stats = await analyzer.analyzeWorkspace();
            if (stats) {
                // 保存统计结果
                await stateManager.saveStats(stats);
                
                // 更新UI显示
                uiManager.updateStatusBar(stats);
                
                // 显示成功消息
                const action = await vscode.window.showInformationMessage(
                    `分析完成！共统计 ${stats.totalFiles} 个文件，${stats.totalLines.toLocaleString()} 行代码`,
                    '查看详细报告',
                    '关闭'
                );
                
                if (action === '查看详细报告') {
                    await uiManager.showStatsReport(stats);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`分析失败: ${error}`);
        }
    });

    // 注册命令：显示统计报告
    const showReportCommand = vscode.commands.registerCommand('code-statistics.showReport', async () => {
        const stats = stateManager.getLatestStats();
        if (stats) {
            await uiManager.showStatsReport(stats);
        } else {
            const action = await vscode.window.showInformationMessage(
                '还没有统计数据，是否立即开始分析？',
                '开始分析',
                '取消'
            );
            if (action === '开始分析') {
                vscode.commands.executeCommand('code-statistics.analyze');
            }
        }
    });

    // 注册命令：切换状态栏显示
    const toggleStatusBarCommand = vscode.commands.registerCommand('code-statistics.toggleStatusBar', async () => {
        const config = vscode.workspace.getConfiguration('code-statistics');
        const currentValue = config.get<boolean>('showInStatusBar', true);
        
        await config.update('showInStatusBar', !currentValue, vscode.ConfigurationTarget.Workspace);
        
        // 更新UI
        const stats = stateManager.getLatestStats();
        uiManager.updateStatusBar(stats);
        
        vscode.window.showInformationMessage(
            `状态栏显示已${!currentValue ? '启用' : '禁用'}`
        );
    });

    // 监听配置变化
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('code-statistics')) {
            const stats = stateManager.getLatestStats();
            uiManager.updateStatusBar(stats);
        }
    });

    // 注册所有资源
    context.subscriptions.push(
        analyzeCommand,
        showReportCommand,
        toggleStatusBarCommand,
        configChangeListener,
        analyzer,
        uiManager
    );
}

export function deactivate() {
    console.log('代码统计器插件已停用');
} 