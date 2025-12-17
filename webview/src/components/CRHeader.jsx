import React, { useRef } from 'react';
import { Popover } from 'antd';
import {DownOutlined} from '@ant-design/icons';
import classNames from 'classnames';
import '../styles/components/header.less';

const CRHeader = ({ projectName, branchName, problemCount, onRefresh, isLoading, isCollapsed, onToggleCollapse }) => {
    const headerRef = useRef(null);

    return (
        <div ref={headerRef} className="cr-header" style={{ cursor: 'pointer' }}>
            <div className="cr-header__top">
                <div className="cr-header__brand">
                    <h1 className="cr-header__title">AICR助手</h1>
                </div>

                <div className="cr-header__actions" onClick={(e) => e.stopPropagation()}>
                    <DownOutlined
                        className={classNames('cr-header__collapse-icon', {
                            'cr-header__collapse-icon--collapsed': isCollapsed
                        })}
                        onClick={onToggleCollapse}
                    />
                    {/* <button
                        className={`cr-header__refresh ${isLoading ? 'cr-header__refresh--loading' : ''}`}
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? '刷新中...' : '刷新'}
                    </button> */}
                </div>
            </div>

            <div className="cr-header__info">
                <div className="cr-header__item">
                    <span className="cr-header__label">项目</span>
                    <span className="cr-header__value">{projectName}</span>
                </div>

                {/* <div className="cr-header__divider"></div> */}

                <div className="cr-header__item">
                    <span className="cr-header__label">分支</span>
                    <span className="cr-header__value">{branchName}</span>
                </div>

                {/* <div className="cr-header__divider"></div> */}
                <div className="cr-header__item">
                    <span className="cr-header__label">问题</span>
                    <span className="cr-header__value cr-header__value--count">{problemCount}</span>
                </div>
            </div>
        </div>
    );
};

export default CRHeader;
