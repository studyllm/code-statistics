import * as vscode from 'vscode';
import { ProjectStats } from './types';

export class UIManager {
    private statusBarItem: vscode.StatusBarItem | undefined;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('代码统计器');
    }

    /**
     * 创建或更新状态栏项目
     */
    updateStatusBar(stats: ProjectStats | null): void {
        const config = vscode.workspace.getConfiguration('code-statistics');
        const showInStatusBar = config.get<boolean>('showInStatusBar', true);

        if (!showInStatusBar) {
            this.hideStatusBar();
            return;
        }

        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left, 100
            );
            this.statusBarItem.command = 'code-statistics.showReport';
        }

        if (stats) {
            this.statusBarItem.text = `$(graph) ${this.formatNumber(stats.totalLines)} 行 | ${stats.totalFiles} 文件`;
            this.statusBarItem.tooltip = `代码统计 - 点击查看详细报告\n` +
                `总行数: ${this.formatNumber(stats.totalLines)}\n` +
                `总文件: ${stats.totalFiles}\n` +
                `更新时间: ${stats.timestamp.toLocaleString()}`;
        } else {
            this.statusBarItem.text = `$(graph) 未分析`;
            this.statusBarItem.tooltip = '代码统计器 - 点击开始分析';
        }

        this.statusBarItem.show();
    }

    /**
     * 隐藏状态栏
     */
    hideStatusBar(): void {
        if (this.statusBarItem) {
            this.statusBarItem.hide();
        }
    }

    /**
     * 显示详细统计报告
     */
    async showStatsReport(stats: ProjectStats): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codeStatsReport',
            '代码统计报告',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.generateReportHTML(stats);
    }

    /**
     * 生成统计报告的 HTML
     */
    private generateReportHTML(stats: ProjectStats): string {
        const fileTypeStats = Object.entries(stats.byFileType)
            .sort(([,a], [,b]) => b.lines - a.lines)
            .map(([ext, data]) => `
                <tr>
                    <td>${ext || 'unknown'}</td>
                    <td>${data.files}</td>
                    <td>${this.formatNumber(data.lines)}</td>
                    <td>${this.formatBytes(data.size)}</td>
                    <td>${((data.lines / stats.totalLines) * 100).toFixed(1)}%</td>
                </tr>
            `).join('');

        return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>代码统计报告</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 20px;
                }
                .header {
                    border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 15px;
                    border-radius: 5px;
                    text-align: center;
                }
                .stat-number {
                    font-size: 2em;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                .stat-label {
                    font-size: 0.9em;
                    opacity: 0.8;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                }
                th {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    font-weight: bold;
                }
                tr:hover {
                    background: var(--vscode-list-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 代码统计报告</h1>
                <p><strong>工作区:</strong> ${stats.workspaceName}</p>
                <p><strong>分析时间:</strong> ${stats.timestamp.toLocaleString()}</p>
            </div>

            <div class="summary">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalFiles}</div>
                    <div class="stat-label">总文件数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.formatNumber(stats.totalLines)}</div>
                    <div class="stat-label">总代码行数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.formatBytes(stats.totalSize)}</div>
                    <div class="stat-label">总文件大小</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Object.keys(stats.byFileType).length}</div>
                    <div class="stat-label">文件类型数</div>
                </div>
            </div>

            <h2>按文件类型统计</h2>
            <table>
                <thead>
                    <tr>
                        <th>文件类型</th>
                        <th>文件数</th>
                        <th>代码行数</th>
                        <th>大小</th>
                        <th>占比</th>
                    </tr>
                </thead>
                <tbody>
                    ${fileTypeStats}
                </tbody>
            </table>
        </body>
        </html>`;
    }

    /**
     * 格式化数字显示
     */
    private formatNumber(num: number): string {
        return num.toLocaleString();
    }

    /**
     * 格式化字节大小
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    dispose(): void {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
        }
        this.outputChannel.dispose();
    }
} 