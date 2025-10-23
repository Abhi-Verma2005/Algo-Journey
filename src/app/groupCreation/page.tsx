'use client'
import UnifiedGroupManagement from '@/components/Group'
import useStore from '@/store/store'
import React from 'react'

function Page() {
  const { isDarkMode } = useStore()
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'} border-0 transition-colors duration-300`}>
      <UnifiedGroupManagement/>
    </div>
  )
}

export default Page
