import React from 'react'

function ConfirmModal({ open, isOpen, onClose, onConfirm, title, message }) {
  const visible = typeof open === 'boolean' ? open : isOpen

  if (!visible) return null

  return (
    <div className="modal-mask show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
        </div>
        <div className="modal-body">
          <div className="modal-text">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose}>
            取消
          </button>
          <button className="modal-btn danger" onClick={() => onConfirm?.()}>
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
