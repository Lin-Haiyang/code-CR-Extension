import React from 'react';
import '../styles/components/loading.less';

const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div className="loading-spinner__ring"></div>
            <div className="loading-spinner__ring"></div>
            <div className="loading-spinner__ring"></div>
            <div className="loading-spinner__text">AI 正在分析...</div>
        </div>
    );
};

export default LoadingSpinner;
