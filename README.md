# AI CR Extension

一个具有 AI 科技感的 VS Code 代码审查(Code Review)辅助扩展,帮助开发者快速定位和修复代码问题。

## ✨ 功能特性

- 🤖 **AI 风格界面**: 使用 React + Less 构建的炫酷 Webview 界面
- 🎨 **现代化设计**: 深色主题、渐变色、毛玻璃效果、动画过渡
- 📍 **活动栏集成**: 在 VS Code 活动栏显示 🤖 图标,一键访问
- 🔍 **智能高亮**: 点击问题自动跳转并高亮相关代码行
- 🔄 **实时刷新**: 支持手动刷新 CR 问题列表
- 📊 **问题分类**: 按严重程度(错误/警告/建议)显示不同图标和样式

## 🚀 快速开始

### 前置要求

- Node.js >= 14.x
- VS Code >= 1.60.0

### 开发环境搭建

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd code-CR-Extension
   ```

2. **安装扩展依赖**
   ```bash
   npm install
   ```

3. **构建 Webview 前端**
   ```bash
   cd webview
   npm install
   npm run build
   ```
   
   或者使用开发模式(自动监听文件变化):
   ```bash
   npm run dev
   ```

4. **启动调试**
   - 在 VS Code 中打开项目
   - 按 `F5` 或点击"运行和调试"
   - 选择"Run Extension"
   - 扩展开发宿主窗口会自动打开

### 使用方法

1. **打开 AI CR 面板**
   - 点击活动栏的 🤖 机器人图标
   - 或使用命令面板 (`Cmd+Shift+P`) 搜索 "AI CR"

2. **查看问题**
   - 侧边栏会显示当前项目的 CR 问题列表
   - 每个问题卡片显示文件路径、行号、问题描述和建议

3. **跳转到代码**
   - 点击任意问题卡片
   - 自动打开对应文件并高亮相关代码(紫蓝色背景,持续3秒)

4. **刷新问题列表**
   - 点击面板标题栏的 🔄 刷新按钮
   - 或使用命令 "刷新CR问题"

## 📁 项目结构

```
code-CR-Extension/
├── extension.js              # 扩展主文件
├── package.json              # 扩展配置
├── dist/
│   └── webview.js           # 构建后的前端文件
└── webview/                 # React 前端应用
    ├── src/
    │   ├── components/      # React 组件
    │   ├── styles/          # Less 样式文件
    │   ├── App.jsx          # 主应用组件
    │   └── index.jsx        # 入口文件
    ├── package.json         # 前端依赖
    └── webpack.config.js    # Webpack 配置
```

## ⚙️ 配置说明

### API 地址配置

在 `extension.js` 的 `fetchCRProblems` 函数中配置后端 API 地址:

```javascript
const apiUrl = `https://api.example.com/cr-problems/${encodeURIComponent(projectKey)}`;
```

### 构建脚本

- `npm run build:webview`: 生产环境构建
- `npm run dev:webview`: 开发环境构建(watch 模式)

## ⚠️ 重要注意事项

### 1. 首次运行必须构建

在首次运行或修改 React 代码后,**必须**先构建 Webview:

```bash
cd webview
npm run build
```

否则扩展会因为找不到 `dist/webview.js` 而无法正常显示界面。

### 2. JSX Lint 错误

项目中的 JSX lint 错误是 VS Code 的 TypeScript 检查导致的,不影响实际运行。已通过 `webview/jsconfig.json` 配置解决,Webpack 构建时会正确处理 JSX。

### 3. 开发模式刷新

在开发模式下修改 React 代码后:
1. Webpack 会自动重新构建
2. 需要在扩展开发宿主窗口按 `Cmd+R` 刷新扩展
3. 或者重新按 `F5` 启动调试

### 4. 后端 API

当前使用模拟数据,实际使用时需要:
1. 配置真实的后端 API 地址
2. 确保 API 返回格式符合预期:
   ```json
   {
     "code": 0,
     "data": [
       {
         "id": "1",
         "filePath": "src/app.jsx",
         "codeLine": "25-29",
         "name": "问题描述",
         "suggest": "修复建议"
       }
     ]
   }
   ```

### 5. Git 分支获取

扩展会自动获取当前 Git 分支信息,确保项目是 Git 仓库。

## 🎨 样式定制

所有样式变量定义在 `webview/src/styles/variables.less`:

- 配色方案
- 渐变色
- 间距
- 字体
- 动画时长

修改后需要重新构建 Webview。

## 🐛 故障排除

### 问题: 面板显示空白

**解决方案**:
1. 检查 `dist/webview.js` 是否存在
2. 运行 `cd webview && npm run build`
3. 重新加载扩展窗口

### 问题: 样式未生效

**解决方案**:
1. 确认 Less 文件导入路径正确
2. 清除缓存: `rm -rf webview/node_modules/.cache`
3. 重新运行 `npm run build`

### 问题: 高亮不显示

**解决方案**:
1. 确认文件路径正确
2. 检查代码行号格式(支持 "25" 或 "20-45")
3. 查看控制台错误信息

## 📝 开发日志

- ✅ 完成 React + Less 前端架构
- ✅ 实现 AI 风格 UI 组件
- ✅ 集成到 VS Code 活动栏
- ✅ 实现代码跳转和高亮
- ✅ 优化高亮效果(紫蓝色渐变风格)

## 📄 License

MIT

---

**Enjoy coding with AI CR Assistant!** 🚀
