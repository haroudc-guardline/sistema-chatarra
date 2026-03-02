import { supabase } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/database'

export const userService = {
  // List all users
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Profile[]
  },

  // Get user by ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Profile
  },

  // Create user (also creates auth user)
  async createUser(email: string, password: string, nombre: string, rol: UserRole) {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // The profile will be created automatically via trigger or we create it manually
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        nombre,
        rol,
        activo: true
      })

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return authData.user
  },

  // Update user
  async updateUser(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  // Delete user
  async deleteUser(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Toggle user active status
  async toggleUserStatus(id: string, activo: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ activo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  // Reset user password (admin only)
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  },

  // Get current user profile
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data as Profile
  }
}
