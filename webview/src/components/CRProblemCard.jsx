import React from 'react';
import classNames from 'classnames';
import '../styles/components/cr-card.less';

const sourceMap = {
    'ai': 'AI 建议',
    'manual': '人工建议',
}

const severityMap = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'critical': '高',
}

const CRProblemCard = ({ problem, onClick, selected = false }) => {
    const { source, severity } = problem;

    return (
        <div
            className={classNames('cr-card', `cr-card--${severity}`, {
                'cr-card--selected': selected
            })}
            onClick={() => onClick(problem)}
        >
            <div className="cr-card__header">
                <span className="cr-card__icon">严重程度：{severityMap[severity]}</span>
                {/* <h3 className="cr-card__title">{problem.name}</h3> */}
            </div>

            {/* <div className="cr-card__meta">
                <span className="cr-card__file">📄 {problem.filePath}</span>
                <span className="cr-card__line">📍 行 {problem.codeLine}</span>
            </div> */}

            <div className="cr-card__content">
                <p className="cr-card__suggest">{problem.suggest}</p>
            </div>

            <div className="cr-card__footer">
                <span className={classNames('cr-card__badge', `cr-card__badge-${source}`)}>{sourceMap[source]}</span>
                <span className="cr-card__action">点击查看 →</span>
            </div>
        </div>
    );
};

export default CRProblemCard;
