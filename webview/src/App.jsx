import React, { useState, useEffect } from 'react';
import CRHeader from './components/CRHeader';
import CRProblemCard from './components/CRProblemCard';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState from './components/EmptyState';
import ParticleBackground from './components/ParticleBackground';
import './styles/app.less';

// 获取 VS Code API
const vscode = acquireVsCodeApi();

function App() {
    const [problems, setProblems] = useState([]);
    const [projectInfo, setProjectInfo] = useState({
        projectName: '加载中...',
        branchName: '加载中...',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        // 监听来自扩展的消息
        const handleMessage = (event) => {
            const message = event.data;

            switch (message.type) {
                case 'updateProblems':
                    setProblems(message.problems || []);
                    setIsLoading(false);
                    break;

                case 'updateProjectInfo':
                    setProjectInfo({
                        projectName: message.projectName,
                        branchName: message.branchName,
                    });
                    break;

                case 'loading':
                    setIsLoading(true);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // 请求初始数据
        vscode.postMessage({ type: 'ready' });

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleRefresh = () => {
        setIsLoading(true);
        vscode.postMessage({ type: 'refresh' });
    };

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleCardClick = (problem) => {
        // 切换选中状态：如果点击的是已选中的卡片，则取消选中；否则选中当前卡片
        setSelectedProblemId(selectedProblemId === problem.id ? null : problem.id);
        vscode.postMessage({
            type: 'openFile',
            problem: problem
        });
    };

    return (
        <div className="app">
            <ParticleBackground />
            <CRHeader
                projectName={projectInfo.projectName}
                branchName={projectInfo.branchName}
                problemCount={problems.length}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                isCollapsed={isCollapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <div className={`app__content ${isCollapsed ? 'app__content--collapsed' : ''}`}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : problems.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="app__problems">
                        {problems.map((problem) => (
                            <CRProblemCard
                                key={problem.id}
                                problem={problem}
                                onClick={handleCardClick}
                                selected={selectedProblemId === problem.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
