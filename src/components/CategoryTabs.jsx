import React from 'react'
import { useApp } from '../context/AppContext.jsx'

function CategoryTabs() {
  const { tabs, currentTab, setCurrentTab } = useApp()

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.value}
            className={`tab-item ${currentTab === tab.value ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.value)}
          >
            <span className="tab-text">{tab.label}</span>
            <div className="tab-underline" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryTabs
