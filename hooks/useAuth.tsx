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
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  // sessionExists: true = session confirmed, false = no session, null = still resolving
  const [sessionExists, setSessionExists] = useState<boolean | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Effect 1: Listen to auth state changes (sync only — no DB calls here)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setSessionUserId(session.user.id)
          setSessionExists(true)
        } else {
          setSessionUserId(null)
          setUser(null)
          setSessionExists(false)
          setProfileLoaded(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Effect 2: Fetch profile when we have a userId (separate from auth callback)
  useEffect(() => {
    if (!sessionUserId) {
      setProfileLoaded(false)
      return
    }

    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUserId)
      .single()
      .then(({ data: profile, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setUser(profile)
        }
        setProfileLoaded(true)
      })

    return () => { cancelled = true }
  }, [sessionUserId])

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
    setSessionUserId(null)
    setSessionExists(false)
    setProfileLoaded(false)
  }

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.rol)
  }

  // isLoading: auth unknown OR session exists but profile not yet fetched
  const isLoading = sessionExists === null || (sessionExists === true && !profileLoaded)

  const value: AuthContextType = {
    user,
    isLoading,
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
