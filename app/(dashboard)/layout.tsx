'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardSkeleton } from '@/components/feedback/Skeletons'
import { TutorialDialog } from '@/components/feedback/TutorialDialog'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating Help Avatar */}
      <button
        onClick={() => setShowTutorial(true)}
        className="fixed bottom-6 right-6 z-50 group"
        title="Ayuda y Tutorial"
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 opacity-40 group-hover:opacity-60 blur-sm transition-opacity" />
          {/* Avatar */}
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-xl shadow-emerald-500/20 transition-transform group-hover:scale-110">
            <img
              src="/images/help-avatar.png"
              alt="Asistente de ayuda"
              className="h-full w-full object-cover"
            />
          </div>
          {/* Badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
            ?
          </span>
        </div>
      </button>

      <TutorialDialog open={showTutorial} onOpenChange={setShowTutorial} />
    </div>
  )
}
