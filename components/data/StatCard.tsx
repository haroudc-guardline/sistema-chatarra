import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'
  className?: string
  onClick?: () => void
  isLoading?: boolean
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500 to-blue-700',
    shadow: 'shadow-blue-500/20',
    hoverShadow: 'shadow-blue-500/30',
    gradient: 'from-blue-600/0 via-blue-600/0 to-blue-600/5',
    trend: 'text-blue-600 bg-blue-50',
  },
  emerald: {
    bg: 'from-emerald-500 to-emerald-700',
    shadow: 'shadow-emerald-500/20',
    hoverShadow: 'shadow-emerald-500/30',
    gradient: 'from-emerald-600/0 via-emerald-600/0 to-emerald-600/5',
    trend: 'text-emerald-600 bg-emerald-50',
  },
  amber: {
    bg: 'from-amber-500 to-amber-700',
    shadow: 'shadow-amber-500/20',
    hoverShadow: 'shadow-amber-500/30',
    gradient: 'from-amber-600/0 via-amber-600/0 to-amber-600/5',
    trend: 'text-amber-600 bg-amber-50',
  },
  rose: {
    bg: 'from-rose-500 to-rose-700',
    shadow: 'shadow-rose-500/20',
    hoverShadow: 'shadow-rose-500/30',
    gradient: 'from-rose-600/0 via-rose-600/0 to-rose-600/5',
    trend: 'text-rose-600 bg-rose-50',
  },
  violet: {
    bg: 'from-violet-500 to-violet-700',
    shadow: 'shadow-violet-500/20',
    hoverShadow: 'shadow-violet-500/30',
    gradient: 'from-violet-600/0 via-violet-600/0 to-violet-600/5',
    trend: 'text-violet-600 bg-violet-50',
  },
  slate: {
    bg: 'from-slate-500 to-slate-700',
    shadow: 'shadow-slate-500/20',
    hoverShadow: 'shadow-slate-500/30',
    gradient: 'from-slate-600/0 via-slate-600/0 to-slate-600/5',
    trend: 'text-slate-600 bg-slate-50',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'slate',
  className,
  onClick,
  isLoading = false,
}: StatCardProps) {
  const colors = colorVariants[color]

  return (
    <Card
      className={cn(
        'group bg-white/70 backdrop-blur-md border-white/50 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:bg-white/90 transition-all duration-300 overflow-hidden relative',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        colors.gradient
      )} />

      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60",
        colors.bg
      )} />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {value}
                </span>
              )}
              {!isLoading && trend && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  colors.trend
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend.isPositive ? '+' : '-'}{trend.value}%
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="h-4 w-32 bg-slate-100 rounded mt-2 animate-pulse" />
            ) : description && (
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0 ml-3",
            colors.bg,
            colors.shadow,
            colors.hoverShadow
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
