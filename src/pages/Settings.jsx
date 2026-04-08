import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function Settings() {
  const { userType, setUserType, dynamicTagsEnabled, setDynamicTagsEnabled } = useApp()
  const [showGuideModal, setShowGuideModal] = useState(false)

  const handleRoleSelect = useCallback((role) => {
    setUserType(role)
  }, [setUserType])

  const handleDynamicTagSwitch = useCallback(() => {
    setDynamicTagsEnabled(!dynamicTagsEnabled)
  }, [dynamicTagsEnabled, setDynamicTagsEnabled])

  return (
    <div className="settings-page">
      {/* 头部 */}
      <div className="settings-header">
        <Link to="/" className="back-btn" style={{ textDecoration: 'none' }}>
          ←
        </Link>
        <div className="settings-title">设置</div>
      </div>

      {/* 设置列表 */}
      <div className="settings-list">
        {/* 用户类型 */}
        <div className="settings-item first-item">
          <div className="item-header">
            <div className="item-title">用户类型</div>
          </div>
          <div className="item-row">
            <div className="role-options">
              <button
                className={`role-btn ${userType === '上班族' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('上班族')}
              >
                上班族
              </button>
              <button
                className={`role-btn ${userType === '宝妈' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('宝妈')}
              >
                宝妈
              </button>
            </div>
          </div>
        </div>

        {/* 动态标签开关 */}
        <div className="settings-item last-item">
          <div className="item-row">
            <div className="item-title">显示动态标签</div>
            <div 
              className={`switch ${dynamicTagsEnabled ? 'checked' : ''}`}
              onClick={handleDynamicTagSwitch}
            >
              <div className="switch-thumb" />
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明按钮 */}
      <div className="guide-btn" onClick={() => setShowGuideModal(true)}>
        使用示例
      </div>

      {/* 使用说明弹窗 */}
      <div className={`modal-mask ${showGuideModal ? 'show' : ''}`} onClick={() => setShowGuideModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">使用示例</div>
          </div>
          <div className="guide-modal-body">
            <div className="guide-section">智能输入</div>
            <div className="guide-line">• 明天下午3点开会 → 日程：明天 15:00</div>
            <div className="guide-line">• 周五上午10点面试 → 日程：周五 10:00</div>
            <div className="guide-line">• 买牛奶和鸡蛋 → 购物</div>
            <div className="guide-line">• 下午两点去超市买水果 → 日程：今天 14:00</div>
            
            <div className="guide-divider" />
            
            <div className="guide-section">动态标签</div>
            <div className="guide-line">• 工作：开会、会议、汇报、周报、面试</div>
            <div className="guide-line">• 育儿：奶粉、尿布、玩具、接孩子</div>
            
            <div className="guide-divider" />
            
            <div className="guide-section">长按操作</div>
            <div className="guide-line">• 长按事项卡片可弹出菜单</div>
            <div className="guide-line">• 支持修改时间、修改分类、删除</div>
            
            <div className="guide-divider" />
            
            <div className="guide-section">智能排序</div>
            <div className="guide-line">• 上班族：日程按时间排序</div>
            <div className="guide-line">• 宝妈：购物优先显示</div>
            
            <div className="guide-author">作者：朱东刚 | 版本 1.0.0 </div>
          </div>
          <div className="guide-confirm" onClick={() => setShowGuideModal(false)}>
            知道了
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
