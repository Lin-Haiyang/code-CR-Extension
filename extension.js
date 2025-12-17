// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { simpleGit } = require('simple-git');
const path = require('path');
const axios = require('axios');

/**
 * 获取项目名称和git分支信息
 * @param {string} workspaceRoot 工作区根目录
 * @returns {Promise<{projectName: string, branchName: string}>}
 */
async function getProjectInfo(workspaceRoot) {
	try {
		// 获取项目名称（从工作区根目录获取）
		const projectName = path.basename(workspaceRoot);

		// 获取git分支名称
		const git = simpleGit(workspaceRoot);
		const branchInfo = await git.branch();
		const branchName = branchInfo.current || '未知分支';

		return { projectName, branchName };
	} catch (error) {
		console.error('获取项目信息失败:', error);
		return {
			projectName: path.basename(workspaceRoot),
			branchName: '获取分支失败'
		};
	}
}

/**
 * 调用后端接口获取CR问题列表
 * @param {string} projectName 项目名称
 * @param {string} branchName 分支名称
 * @returns {Promise<Array>} CR问题列表
 */
async function fetchCRProblems(projectName, branchName) {
	try {

		// 这里使用模拟的后端接口URL，实际使用时需要替换为真实的后端地址
		const apiUrl = `http://172.30.107.66:3000/api/external/suggestions?project_name=${projectName}&branch_name=${branchName}`;

		const { data: res } = await axios.get(apiUrl, {
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		console.log('🚀 ~ fetchCRProblems ~ res:', res);

		const { data, code } = res || {};

		if (code === 0) {
			const handleData = data?.suggestions?.map((item) => {
				const { startLine, endLine, suggestion } = item || {};
				return {
					...item,
					codeLine: `${startLine}-${endLine}`,
					name: suggestion,
					suggest: suggestion,
				}
			})

			return handleData || [];
		} else {
			console.error('获取CR问题失败:', res.data?.msg || '未知错误');
			return [];
		}
	} catch (error) {
		console.error('调用CR问题接口失败:', error);
		// 返回模拟数据用于演示
		// return getMockCRProblems();
		return [];
	}
}

/**
 * 获取模拟的CR问题数据（用于演示）
 * @returns {Array} 模拟的CR问题列表
 */
function getMockCRProblems() {
	return [
		{
			id: "1",
			filePath: "src/app.jsx",
			codeLine: "25-29",
			name: "变量命名不规范",
			suggest: "建议将变量名从 'data' 改为更具描述性的 'userProfileData'"
		},
		{
			id: "2",
			filePath: "src/components/BlockHeader/index.js",
			codeLine: "10-20",
			name: "缺少错误处理",
			suggest: "建议在异步函数中添加 try-catch 错误处理机制"
		},
		{
			id: "3",
			filePath: "src/pages/RatingReports/Reports/KeypointRating.js",
			codeLine: "186-196",
			name: "硬编码URL",
			suggest: "建议将API URL提取到配置文件中，避免硬编码"
		},
		{
			id: "4",
			filePath: "src/pages/RatingReports/Reports/KeypointRating.js",
			codeLine: "300-400",
			name: "函数过长需要重构",
			suggest: "建议将长函数拆分为多个小函数，提高代码可读性"
		}
	];
}

/**
 * 解析代码行范围
 * @param {string} codeLine 代码行字符串，可能是单行"25"或区间"20-45"
 * @returns {Object} 包含startLine和endLine的对象
 */
function parseCodeLineRange(codeLine) {
	const lineStr = codeLine.toString().trim();

	if (lineStr.includes('-')) {
		// 处理区间格式 "20-45"
		const [start, end] = lineStr.split('-').map(num => parseInt(num.trim()));
		return {
			startLine: Math.max(1, start),
			endLine: Math.max(start, end)
		};
	} else {
		// 处理单行格式 "25"
		const line = parseInt(lineStr);
		return {
			startLine: Math.max(1, line),
			endLine: Math.max(1, line)
		};
	}
}

/**
 * 打开文件并高亮指定行或行区间
 * @param {Object} problem CR问题对象
 */
async function openFileAndHighlightLine(problem) {
	try {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('未找到工作区');
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const filePath = path.resolve(workspaceRoot, problem.filePath);

		// 检查文件是否存在
		const fileUri = vscode.Uri.file(filePath);

		try {
			await vscode.workspace.fs.stat(fileUri);
		} catch {
			vscode.window.showErrorMessage(`文件找不到: ${problem.filePath}`);
			return;
		}

		// 打开文件
		const document = await vscode.workspace.openTextDocument(fileUri);
		const editor = await vscode.window.showTextDocument(document);

		// 解析行范围
		const { startLine, endLine } = parseCodeLineRange(problem.codeLine);

		// VS Code行号从0开始，所以需要减1
		const startLineIndex = Math.max(0, Math.min(startLine - 1, document.lineCount - 1));
		const endLineIndex = Math.max(0, Math.min(endLine - 1, document.lineCount - 1));

		// 获取起始和结束位置
		const startPosition = new vscode.Position(startLineIndex, 0);
		const endLine_obj = document.lineAt(endLineIndex);
		const endPosition = new vscode.Position(endLineIndex, endLine_obj.range.end.character);

		// 创建高亮范围
		const highlightRange = new vscode.Range(startPosition, endPosition);

		// 设置光标位置和选择范围（定位到起始行）
		editor.selection = new vscode.Selection(startPosition, startPosition);
		editor.revealRange(highlightRange, vscode.TextEditorRevealType.InCenter);

		// 创建紫色渐变风格的高亮 (使用渐变中间色调)
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(102, 126, 234, 0.3)', // 紫蓝色,接近渐变效果
			isWholeLine: true
		});

		// 应用高亮
		editor.setDecorations(decorationType, [highlightRange]);

		// 2秒后移除高亮
		setTimeout(() => {
			decorationType.dispose();
		}, 3000);

        // 显示信息消息
        const lineInfo = startLine === endLine
            ? `第 ${startLine} 行`
            : `第 ${startLine}-${endLine} 行`;
        const message = `已定位到 ${problem.filePath} ${lineInfo}`;
        vscode.window.showInformationMessage(message);

	} catch (error) {
		console.error('打开文件失败:', error);
		vscode.window.showErrorMessage(`打开文件失败: ${error.message}`);
	}
}

/**
 * AI CR Webview View Provider
 */
class AICRViewProvider {
	constructor(context) {
		this._context = context;
		this._view = undefined;
		this._currentBranchName = null; // 保存当前分支名称，用于检测分支切换
		this._branchCheckTimer = null; // 防抖定时器
		this._fileWatcher = null; // 文件监听器
		this._pollingInterval = null; // 轮询定时器
		this._workspaceRoot = null; // 工作区根目录
	}

	resolveWebviewView(webviewView, context, token) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(this._context.extensionPath, 'dist'))
			]
		};

		webviewView.webview.html = this._getWebviewContent(webviewView.webview);

		// 处理来自 Webview 的消息
		webviewView.webview.onDidReceiveMessage(
			async message => {
				switch (message.type) {
					case 'ready':
						// Webview 准备好了，发送初始数据
						await this._updateWebviewData();
						break;

					case 'refresh':
						// 刷新数据
						await this._updateWebviewData();
						break;

				case 'openFile':
					// 打开文件
					await openFileAndHighlightLine(message.problem);
					break;
				}
			}
		);

		// 设置分支监听器
		this._setupBranchWatcher();
	}

	/**
	 * 检查分支是否改变
	 */
	async _checkBranchChange() {
		if (!this._workspaceRoot) {
			return;
		}

		try {
			const { branchName } = await getProjectInfo(this._workspaceRoot);
			
			// 检查分支是否真的改变了
			if (this._currentBranchName && this._currentBranchName !== branchName) {
				console.log(`检测到分支切换: ${this._currentBranchName} -> ${branchName}`);
				// 分支改变了，刷新CR界面
				await this._updateWebviewData();
				vscode.window.showInformationMessage(`已切换到分支: ${branchName}，CR问题列表已刷新`);
			} else if (!this._currentBranchName) {
				// 首次设置分支名称
				this._currentBranchName = branchName;
			}
		} catch (error) {
			console.error('检测分支切换失败:', error);
		}
	}

	/**
	 * 设置分支切换监听器（文件监听 + 轮询双重机制）
	 */
	_setupBranchWatcher() {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return;
		}

		this._workspaceRoot = workspaceFolders[0].uri.fsPath;

		// 清理旧的监听器
		if (this._fileWatcher) {
			this._fileWatcher.dispose();
		}
		if (this._pollingInterval) {
			clearInterval(this._pollingInterval);
		}

		// 方式1: 文件系统监听器，监听 .git/HEAD 文件变化
		this._fileWatcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(this._workspaceRoot, '.git/HEAD')
		);

		// 监听文件变化事件（使用防抖）
		this._fileWatcher.onDidChange(() => {
			if (this._branchCheckTimer) {
				clearTimeout(this._branchCheckTimer);
			}
			this._branchCheckTimer = setTimeout(() => {
				this._checkBranchChange();
			}, 500); // 500ms 防抖延迟
		});

		// 方式2: 轮询机制，定期检查分支名称（捕获所有分支切换情况）
		// 每2秒检查一次分支名称
		this._pollingInterval = setInterval(() => {
			this._checkBranchChange();
		}, 2000);

		// 将监听器添加到订阅中，确保在扩展停用时清理
		this._context.subscriptions.push(this._fileWatcher);
		this._context.subscriptions.push({
			dispose: () => {
				if (this._pollingInterval) {
					clearInterval(this._pollingInterval);
				}
				if (this._branchCheckTimer) {
					clearTimeout(this._branchCheckTimer);
				}
			}
		});
	}

	/**
	 * 更新 Webview 数据
	 */
	async _updateWebviewData() {
		if (!this._view) {
			return;
		}

		try {
			// 发送加载状态
			this._view.webview.postMessage({ type: 'loading' });

			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				this._view.webview.postMessage({
					type: 'updateProblems',
					problems: []
				});
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const { projectName, branchName } = await getProjectInfo(workspaceRoot);

			// 更新当前分支名称
			this._currentBranchName = branchName;

			// 发送项目信息
			this._view.webview.postMessage({
				type: 'updateProjectInfo',
				projectName,
				branchName
			});

			// 获取并发送问题列表
			const problems = await fetchCRProblems(projectName, branchName);
			this._view.webview.postMessage({
				type: 'updateProblems',
				problems
			});
		} catch (error) {
			console.error('更新数据失败:', error);
			vscode.window.showErrorMessage('更新CR问题失败: ' + error.message);
		}
	}

	/**
	 * 获取 Webview HTML 内容
	 */
	_getWebviewContent(webview) {
		const scriptPath = vscode.Uri.file(
			path.join(this._context.extensionPath, 'dist', 'webview.js')
		);
		const scriptUri = webview.asWebviewUri(scriptPath);

		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
	<title>AI CR Assistant</title>
</head>
<body>
	<div id="root"></div>
	<script src="${scriptUri}"></script>
</body>
</html>`;
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "AICRAssistant" is now active!');

	// 创建并注册 Webview View Provider
	const provider = new AICRViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('aiCRPanel', provider)
	);

	// 注册刷新命令
	const refreshDisposable = vscode.commands.registerCommand('aiCRAssistant.refreshCRProblems', async function () {
		await provider._updateWebviewData();
		vscode.window.showInformationMessage('CR问题列表已刷新');
	});

	// 保留原有的 Hello World 命令
	const helloWorldDisposable = vscode.commands.registerCommand('aiCRAssistant.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from AICRAssistant!');
	});

	// 注册显示项目信息的命令
	const showProjectInfoDisposable = vscode.commands.registerCommand('aiCRAssistant.showProjectInfo', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('未找到工作区，请先打开一个项目文件夹');
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;

		try {
			const { projectName, branchName } = await getProjectInfo(workspaceRoot);
			const message = `${projectName}-${branchName}`;
			vscode.window.showInformationMessage(message);
		} catch (error) {
			vscode.window.showErrorMessage(`获取项目信息失败: ${error.message}`);
		}
	});

	context.subscriptions.push(
		refreshDisposable,
		helloWorldDisposable,
		showProjectInfoDisposable
	);

	// 将 provider 添加到订阅中，确保在扩展停用时清理资源
	context.subscriptions.push({
		dispose: () => {
			if (provider._branchCheckTimer) {
				clearTimeout(provider._branchCheckTimer);
			}
			if (provider._fileWatcher) {
				provider._fileWatcher.dispose();
			}
			if (provider._pollingInterval) {
				clearInterval(provider._pollingInterval);
			}
		}
	});
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
