'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardSkeleton } from '@/components/feedback/Skeletons'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
