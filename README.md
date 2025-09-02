# 代码统计器 VS Code 插件

> 智能代码统计器，分析你的项目规模和结构

## ✨ 功能特性

- 📊 **全面统计**：分析代码库的文件数量、代码行数、文件大小
- 🏷️ **分类统计**：按文件类型分组展示详细统计信息
- ⚙️ **灵活配置**：支持自定义排除规则和包含的文件类型
- 💾 **历史记录**：持久化保存统计历史，支持趋势分析
- 📱 **状态栏显示**：实时显示关键统计信息
- 📋 **详细报告**：美观的 Web 报告界面

## 🚀 快速开始

### 安装插件

1. 复制插件代码到本地
2. 在VS Code中打开插件目录
3. 按 `F5` 启动调试环境

### 使用方法

1. **开始分析**：
   - 打开命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）
   - 输入"分析代码统计"并执行

2. **查看报告**：
   - 点击状态栏的统计信息
   - 或者执行"显示统计报告"命令

3. **个性化设置**：
   - 打开设置搜索"代码统计器"
   - 配置排除模式、文件类型等

## ⚙️ 配置选项

```json
{
  "code-statistics.excludePatterns": [
    "node_modules", ".git", "dist", "build", "*.min.js"
  ],
  "code-statistics.includedFileTypes": [
    "js", "ts", "jsx", "tsx", "vue", "py", "java", "cs", "cpp", "c", "h"
  ],
  "code-statistics.showInStatusBar": true
}
```

## 🛠️ 开发说明

### 项目结构
```
src/
├── types.ts         # 数据模型定义
├── analyzer.ts      # 核心分析器
├── stateManager.ts  # 状态管理
├── ui.ts           # UI界面管理
└── extension.ts    # 主入口文件
```

### 编译和调试
```bash
# 编译项目
npm run compile

# 监听模式编译
npm run watch

# 启动调试（按 F5 键）
```

## 📋 命令列表

- `code-statistics.analyze` - 分析代码统计
- `code-statistics.showReport` - 显示统计报告  
- `code-statistics.toggleStatusBar` - 切换状态栏显示

## 🔧 技术栈

- TypeScript
- VS Code Extension API
- Node.js 内置模块

## �� 许可证

MIT License 