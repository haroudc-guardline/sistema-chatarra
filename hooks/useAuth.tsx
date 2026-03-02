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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(profile)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
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
  }

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.rol)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
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
