import React, { useState, useEffect } from 'react'

function TimePickerModal({ isOpen, onClose, onConfirm, initialTime = '12:00' }) {
  const [time, setTime] = useState(initialTime)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTime(initialTime)
      setSubmitting(false)
    }
  }, [isOpen, initialTime])

  const handleConfirm = async () => {
    if (submitting) return
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      alert('时间格式错误，请使用 HH:MM 格式（例如 14:30）')
      return
    }
    try {
      setSubmitting(true)
      await onConfirm(time)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-mask show">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">修改时间</div>
        </div>
        <div className="modal-body">
          <input
            type="time"
            className="time-picker-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose}>
            取消
          </button>
          <button className="modal-btn confirm" onClick={handleConfirm} disabled={submitting}>
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimePickerModal
