'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/database'

interface AuthContextType {
  user: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
  isAdmin: boolean
  isOperador: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  // sessionExists: true = session confirmed, false = no session, null = still resolving
  const [sessionExists, setSessionExists] = useState<boolean | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          // No session — resolve immediately, no DB call needed
          setUser(null)
          setSessionExists(false)
          return
        }

        // Session exists → unblock render immediately, load profile in background
        setSessionExists(true)

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser(profile)
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSessionExists(false)
  }

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.rol)
  }

  const value: AuthContextType = {
    user,
    // isLoading only while auth state is unknown (before INITIAL_SESSION fires)
    isLoading: sessionExists === null,
    // isAuthenticated as soon as session is confirmed — doesn't wait for profile fetch
    isAuthenticated: sessionExists === true,
    login,
    logout,
    hasRole,
    isAdmin: user?.rol === 'admin',
    isOperador: user?.rol === 'operador' || user?.rol === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
