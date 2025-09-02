import * as vscode from 'vscode';
import * as path from 'path';
import { FileStats, ProjectStats, StatsConfig } from './types';

export class CodeAnalyzer {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('代码统计器');
    }

    /**
     * 分析工作区代码统计
     */
    async analyzeWorkspace(): Promise<ProjectStats | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('请先打开一个工作区');
            return null;
        }

        // 获取配置
        const config = this.getConfiguration();
        const workspaceFolder = workspaceFolders[0];
        
        this.outputChannel.appendLine(`开始分析工作区: ${workspaceFolder.name}`);
        this.outputChannel.show(true);

        try {
            // 显示进度条
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "正在分析代码统计...",
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0, message: "扫描文件中..." });

                // 递归扫描文件
                const files = await this.scanFiles(workspaceFolder.uri, config, token);
                
                if (token.isCancellationRequested) {
                    return null;
                }

                progress.report({ increment: 50, message: "计算统计信息..." });

                // 计算统计信息
                const stats = await this.calculateStats(workspaceFolder.name, files, progress);
                
                progress.report({ increment: 100, message: "分析完成!" });
                
                this.outputChannel.appendLine(`分析完成! 共分析 ${stats.totalFiles} 个文件`);
                return stats;
            });

        } catch (error) {
            const message = `分析失败: ${error instanceof Error ? error.message : String(error)}`;
            this.outputChannel.appendLine(message);
            vscode.window.showErrorMessage(message);
            throw error;
        }
    }

    /**
     * 递归扫描文件
     */
    private async scanFiles(
        dirUri: vscode.Uri, 
        config: StatsConfig, 
        token: vscode.CancellationToken
    ): Promise<FileStats[]> {
        const results: FileStats[] = [];
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            
            for (const [name, type] of entries) {
                if (token.isCancellationRequested) {
                    break;
                }

                // 检查是否应该排除
                if (this.shouldExclude(name, config.excludePatterns)) {
                    continue;
                }

                const itemUri = vscode.Uri.joinPath(dirUri, name);

                if (type === vscode.FileType.Directory) {
                    // 递归处理子目录
                    const subFiles = await this.scanFiles(itemUri, config, token);
                    results.push(...subFiles);
                } else if (type === vscode.FileType.File) {
                    // 处理文件
                    const fileStats = await this.analyzeFile(itemUri, config);
                    if (fileStats) {
                        results.push(fileStats);
                    }
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`扫描目录失败 ${dirUri.path}: ${error}`);
        }

        return results;
    }

    /**
     * 分析单个文件
     */
    private async analyzeFile(fileUri: vscode.Uri, config: StatsConfig): Promise<FileStats | null> {
        try {
            const fileName = path.basename(fileUri.path);
            const extension = path.extname(fileName).substring(1).toLowerCase();
            
            // 检查文件类型是否在包含列表中
            if (config.includedFileTypes.length > 0 && !config.includedFileTypes.includes(extension)) {
                return null;
            }

            // 检查文件大小限制
            const fileStat = await vscode.workspace.fs.stat(fileUri);
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB限制
            
            if (fileStat.size > MAX_FILE_SIZE) {
                this.outputChannel.appendLine(`跳过大文件: ${fileUri.path} (${this.formatBytes(fileStat.size)})`);
                return {
                    path: vscode.workspace.asRelativePath(fileUri),
                    extension,
                    lines: 0, // 大文件不计算行数
                    size: fileStat.size,
                    lastModified: new Date(fileStat.mtime)
                };
            }

            // 读取文件内容
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(fileContent).toString('utf8');
            
            // 计算行数（过滤空行）
            const lines = content.split('\n').filter(line => line.trim().length > 0).length;

            return {
                path: vscode.workspace.asRelativePath(fileUri),
                extension,
                lines,
                size: fileStat.size,
                lastModified: new Date(fileStat.mtime)
            };

        } catch (error) {
            if ((error as any).code === 'EACCES' || (error as any).code === 'EPERM') {
                // 权限错误，跳过该文件
                this.outputChannel.appendLine(`跳过受保护文件: ${fileUri.path}`);
                return null;
            }
            this.outputChannel.appendLine(`分析文件失败 ${fileUri.path}: ${error}`);
            return null;
        }
    }

    /**
     * 计算整体统计信息
     */
    private async calculateStats(
        workspaceName: string, 
        files: FileStats[], 
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ): Promise<ProjectStats> {
        
        const byFileType: Record<string, { files: number; lines: number; size: number }> = {};
        let totalLines = 0;
        let totalSize = 0;

        // 按文件类型分组统计
        files.forEach((file, index) => {
            totalLines += file.lines;
            totalSize += file.size;

            const ext = file.extension || 'unknown';
            if (!byFileType[ext]) {
                byFileType[ext] = { files: 0, lines: 0, size: 0 };
            }

            byFileType[ext].files += 1;
            byFileType[ext].lines += file.lines;
            byFileType[ext].size += file.size;

            // 更新进度
            if (index % 100 === 0) {
                const percent = Math.floor((index / files.length) * 50); // 50% 的进度用于计算
                progress.report({ 
                    increment: 0, 
                    message: `处理文件 ${index + 1}/${files.length}...` 
                });
            }
        });

        return {
            timestamp: new Date(),
            workspaceName,
            totalFiles: files.length,
            totalLines,
            totalSize,
            byFileType,
            files
        };
    }

    /**
     * 检查文件或目录是否应该被排除
     */
    private shouldExclude(name: string, excludePatterns: string[]): boolean {
        return excludePatterns.some(pattern => {
            // 简单的通配符匹配
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }

    /**
     * 获取插件配置
     */
    private getConfiguration(): StatsConfig {
        const config = vscode.workspace.getConfiguration('code-statistics');
        
        return {
            excludePatterns: config.get<string[]>('excludePatterns', []),
            includedFileTypes: config.get<string[]>('includedFileTypes', []),
            showInStatusBar: config.get<boolean>('showInStatusBar', true)
        };
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
        this.outputChannel.dispose();
    }
} 