import React from 'react';
import '../styles/components/empty-state.less';

const EmptyState = () => {
    return (
        <div className="empty-state">
            <div className="empty-state__icon">✨</div>
            <h3 className="empty-state__title">太棒了!</h3>
            <p className="empty-state__message">
                当前没有发现任何 CR 问题
            </p>
            <p className="empty-state__sub">
                您的代码质量很高
            </p>
        </div>
    );
};

export default EmptyState;
