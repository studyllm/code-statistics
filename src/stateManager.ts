import * as vscode from 'vscode';
import { ProjectStats } from './types';

export class StateManager {
    private context: vscode.ExtensionContext;
    private readonly STATS_HISTORY_KEY = 'statsHistory';
    private readonly MAX_HISTORY_SIZE = 10;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 保存统计结果到历史记录
     */
    async saveStats(stats: ProjectStats): Promise<void> {
        try {
            const history = this.getStatsHistory();
            
            // 添加新的统计结果
            history.unshift(stats);
            
            // 限制历史记录数量
            if (history.length > this.MAX_HISTORY_SIZE) {
                history.splice(this.MAX_HISTORY_SIZE);
            }

            // 保存到工作区状态
            await this.context.workspaceState.update(this.STATS_HISTORY_KEY, history);
            
        } catch (error) {
            vscode.window.showErrorMessage(`保存统计结果失败: ${error}`);
        }
    }

    /**
     * 获取统计历史记录
     */
    getStatsHistory(): ProjectStats[] {
        return this.context.workspaceState.get<ProjectStats[]>(this.STATS_HISTORY_KEY, []);
    }

    /**
     * 获取最新的统计结果
     */
    getLatestStats(): ProjectStats | null {
        const history = this.getStatsHistory();
        return history.length > 0 ? history[0] : null;
    }

    /**
     * 清空统计历史
     */
    async clearHistory(): Promise<void> {
        await this.context.workspaceState.update(this.STATS_HISTORY_KEY, []);
    }

    /**
     * 获取全局配置
     */
    getGlobalConfig<T>(key: string, defaultValue: T): T {
        return this.context.globalState.get<T>(key, defaultValue);
    }

    /**
     * 设置全局配置
     */
    async setGlobalConfig<T>(key: string, value: T): Promise<void> {
        await this.context.globalState.update(key, value);
    }
} 