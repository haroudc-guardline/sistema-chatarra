'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react'
import { ReactNode, useState, Fragment } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  cell: (item: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
  pageSize?: number
  onRowClick?: (item: T) => void
  rowActions?: (item: T) => ReactNode
  expandableRows?: boolean
  renderExpandedRow?: (item: T) => ReactNode
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  pageSize = 10,
  onRowClick,
  rowActions,
  expandableRows = false,
  renderExpandedRow,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
    setCurrentPage(1)
  }

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortConfig.key]
        const bValue = (b as Record<string, unknown>)[sortConfig.key]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    : data

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <div className="h-12 bg-slate-50 border-b" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b last:border-0 px-4 flex items-center">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-slate-50">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {expandableRows && renderExpandedRow && <TableHead className="w-10"></TableHead>}
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      {column.header}
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-[100px]">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => {
              const itemKey = keyExtractor(item)
              const isExpanded = expandedRows.has(itemKey)
              return (
                <Fragment key={`fragment-${itemKey}`}>
                  <TableRow
                    key={itemKey}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-slate-50',
                      expandableRows && renderExpandedRow && isExpanded && 'bg-slate-50'
                    )}
                    onClick={() => {
                      if (expandableRows && renderExpandedRow) {
                        toggleRow(itemKey)
                      } else {
                        onRowClick?.(item)
                      }
                    }}
                  >
                    {expandableRows && renderExpandedRow && (
                      <TableCell className="w-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRow(itemKey)
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={`${itemKey}-${column.key}`}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {rowActions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                  {expandableRows && renderExpandedRow && isExpanded && (
                    <TableRow className="bg-slate-50">
                      <TableCell
                        colSpan={
                          columns.length +
                          (expandableRows ? 1 : 0) +
                          (rowActions ? 1 : 0)
                        }
                        className="p-0"
                      >
                        {renderExpandedRow(item)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, sortedData.length)} de{' '}
            {sortedData.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
