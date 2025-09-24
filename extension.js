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
 * @param {string} projectKey 项目键值（项目名称-分支名称）
 * @returns {Promise<Array>} CR问题列表
 */
async function fetchCRProblems(projectKey) {
	try {
		// 这里使用模拟的后端接口URL，实际使用时需要替换为真实的后端地址
		const apiUrl = `https://api.example.com/cr-problems/${encodeURIComponent(projectKey)}`;
		
		const response = await axios.get(apiUrl, {
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.data && response.data.code === 0) {
			return response.data.data || [];
		} else {
			console.error('获取CR问题失败:', response.data?.msg || '未知错误');
			return [];
		}
	} catch (error) {
		console.error('调用CR问题接口失败:', error);
		// 返回模拟数据用于演示
		return getMockCRProblems();
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
 * CR问题视图提供者
 */
class CRProblemsProvider {
	constructor(context) {
		this.context = context;
		this.crProblems = [];
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element) {
		return element;
	}

	getChildren() {
		return this.crProblems;
	}

	async updateProblems() {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			this.crProblems = [];
			this.refresh();
			return;
		}

		try {
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const { projectName, branchName } = await getProjectInfo(workspaceRoot);
			const projectKey = `${projectName}-${branchName}`;
			
			const problems = await fetchCRProblems(projectKey);
			this.crProblems = problems.map(problem => new CRProblemItem(problem, workspaceRoot));
			this.refresh();
		} catch (error) {
			console.error('更新CR问题失败:', error);
			vscode.window.showErrorMessage('更新CR问题失败: ' + error.message);
		}
	}
}

/**
 * CR问题项
 */
class CRProblemItem extends vscode.TreeItem {
	constructor(problem, workspaceRoot) {
		super(problem.name, vscode.TreeItemCollapsibleState.None);
		
		this.problem = problem;
		this.workspaceRoot = workspaceRoot;
		this.tooltip = `${problem.name}\n\n修改建议: ${problem.suggest}`;
		
		// 格式化行信息显示
		const { startLine, endLine } = parseCodeLineRange(problem.codeLine);
		this.description = startLine === endLine 
			? `行 ${startLine}`
			: `行 ${startLine}-${endLine}`;
		
		// 设置点击命令
		this.command = {
			command: 'one-vscode-extension.openFile',
			title: '打开文件',
			arguments: [this.problem]
		};

		// 设置图标
		this.iconPath = new vscode.ThemeIcon('warning');
		
		// 设置上下文值用于右键菜单
		this.contextValue = 'crProblem';
	}
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

		// 创建装饰器用于高亮
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(255, 255, 0, 0.3)', // 黄色背景高亮
			border: '1px solid rgba(255, 255, 0, 0.8)',
			borderRadius: '2px',
			isWholeLine: false
		});

		// 应用高亮
		editor.setDecorations(decorationType, [highlightRange]);

		// 2秒后移除高亮
		setTimeout(() => {
			decorationType.dispose();
		}, 2000);

		// 显示信息消息
		const lineInfo = startLine === endLine 
			? `第 ${startLine} 行`
			: `第 ${startLine}-${endLine} 行`;
		vscode.window.showInformationMessage(`已定位到 ${problem.filePath} ${lineInfo}`);

	} catch (error) {
		console.error('打开文件失败:', error);
		vscode.window.showErrorMessage(`打开文件失败: ${error.message}`);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "one-vscode-extension" is now active!');

	// 创建CR问题视图提供者
	const crProblemsProvider = new CRProblemsProvider(context);
	
	// 注册树视图
	const treeView = vscode.window.createTreeView('crProblemsView', {
		treeDataProvider: crProblemsProvider,
		showCollapseAll: false
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('one-vscode-extension.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from one-vscode-extension!');
	});

	// 注册显示项目信息的命令
	const showProjectInfoDisposable = vscode.commands.registerCommand('one-vscode-extension.showProjectInfo', async function () {
		// 获取当前工作区
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('未找到工作区，请先打开一个项目文件夹');
			return;
		}

		// 获取第一个工作区的路径
		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		
		try {
			// 获取项目信息
			const { projectName, branchName } = await getProjectInfo(workspaceRoot);
			
			// 显示项目信息
			const message = `${projectName}-${branchName}`;
			vscode.window.showInformationMessage(message);
		} catch (error) {
			vscode.window.showErrorMessage(`获取项目信息失败: ${error.message}`);
		}
	});

	// 注册刷新CR问题的命令
	const refreshCRProblemsDisposable = vscode.commands.registerCommand('one-vscode-extension.refreshCRProblems', async function () {
		await crProblemsProvider.updateProblems();
		vscode.window.showInformationMessage('CR问题列表已刷新');
	});

	// 注册打开文件的命令
	const openFileDisposable = vscode.commands.registerCommand('one-vscode-extension.openFile', async function (problem) {
		await openFileAndHighlightLine(problem);
	});

	// 初始加载CR问题
	crProblemsProvider.updateProblems();

	context.subscriptions.push(
		disposable, 
		showProjectInfoDisposable, 
		refreshCRProblemsDisposable, 
		openFileDisposable,
		treeView
	);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
