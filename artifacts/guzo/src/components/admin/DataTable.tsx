import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  MoreHorizontal,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onEdit?: (row: TData) => void;
  onDelete?: (rows: TData[]) => void;
  onExport?: (rows: TData[]) => void;
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  onEdit,
  onDelete,
  onExport,
  searchable = true,
  filterable = true,
  selectable = true,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilters, setShowFilters] = useState(false);

  const table = useReactTable({
    data,
    columns: selectable
      ? [
          {
            id: 'select',
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableHiding: false,
          },
          ...columns,
        ]
      : columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original);
  }, [rowSelection]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.length === 0) return;
    if (confirm(`Delete ${selectedRows.length} selected items?`)) {
      onDelete?.(selectedRows);
      table.resetRowSelection();
    }
  }, [selectedRows, onDelete, table]);

  const handleExport = useCallback(() => {
    if (selectedRows.length > 0) {
      onExport?.(selectedRows);
    } else {
      onExport?.(data);
    }
  }, [selectedRows, data, onExport]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 rounded-full"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {filterable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {selectedRows.length > 0 && onDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="rounded-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedRows.length})
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && filterable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {table.getAllLeafColumns().map(
                (column) =>
                  column.getCanFilter() && (
                    <div key={column.id}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        {column.columnDef.header?.toString() || column.id}
                      </label>
                      <Input
                        value={(column.getFilterValue() as string) ?? ''}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        placeholder={`Filter ${column.id}...`}
                        className="rounded-xl"
                      />
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-1'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of{' '}
          {data.length} entries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center gap-1 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
