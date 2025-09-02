/**
 * 文件统计信息
 */
export interface FileStats {
    /** 文件路径 */
    path: string;
    /** 文件类型 */
    extension: string;
    /** 代码行数 */
    lines: number;
    /** 文件大小（字节） */
    size: number;
    /** 最后修改时间 */
    lastModified: Date;
}

/**
 * 项目统计信息
 */
export interface ProjectStats {
    /** 统计时间 */
    timestamp: Date;
    /** 工作区名称 */
    workspaceName: string;
    /** 总文件数 */
    totalFiles: number;
    /** 总代码行数 */
    totalLines: number;
    /** 总文件大小 */
    totalSize: number;
    /** 按文件类型分组的统计 */
    byFileType: Record<string, {
        files: number;
        lines: number;
        size: number;
    }>;
    /** 文件详细信息 */
    files: FileStats[];
}

/**
 * 统计配置
 */
export interface StatsConfig {
    /** 排除模式 */
    excludePatterns: string[];
    /** 包含的文件类型 */
    includedFileTypes: string[];
    /** 是否显示在状态栏 */
    showInStatusBar: boolean;
} 