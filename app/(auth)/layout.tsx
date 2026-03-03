import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  // El layout debe ser limpio sin restricciones de ancho
  // ya que cada página de auth tiene su propio diseño
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
