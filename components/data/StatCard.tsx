import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-emerald-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
