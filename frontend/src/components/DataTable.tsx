import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, TableSortLabel, Checkbox, IconButton, Tooltip, Chip,
  Box, Typography, TextField, InputAdornment, Menu, MenuItem, Button
} from '@mui/material'
import {
  Search, FilterList, MoreVert, Edit, Delete, Visibility
} from '@mui/icons-material'

interface Column {
  id: string
  label: string
  minWidth?: number
  align?: 'right' | 'left' | 'center'
  format?: (value: any) => string | React.ReactNode
  sortable?: boolean
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  totalCount: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onSearch?: (searchTerm: string) => void
  onFilter?: (filters: Record<string, any>) => void
  onRowAction?: (action: string, row: any) => void
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selected: string[]) => void
  loading?: boolean
  searchPlaceholder?: string
  actions?: Array<{
    label: string
    icon: React.ReactNode
    onClick: (row: any) => void
    color?: 'primary' | 'secondary' | 'error' | 'warning'
  }>
}

export default function DataTable({
  columns,
  data,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  onSearch,
  onFilter,
  onRowAction,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  loading = false,
  searchPlaceholder = "Tìm kiếm...",
  actions = []
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRow, setSelectedRow] = useState<any>(null)

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc'
    const direction = isAsc ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(direction)
    onSort?.(column, direction)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id || row.mssv || row.sessionId)
      onSelectionChange?.(newSelected)
    } else {
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (id: string) => {
    const selectedIndex = selectedRows.indexOf(id)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1))
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1)
      )
    }

    onSelectionChange?.(newSelected)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    setAnchorEl(event.currentTarget)
    setSelectedRow(row)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleAction = (action: string) => {
    if (selectedRow) {
      onRowAction?.(action, selectedRow)
    }
    handleMenuClose()
  }

  const isSelected = (id: string) => selectedRows.indexOf(id) !== -1

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Search and Filter Bar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={() => {/* TODO: Implement filter dialog */}}
        >
          Bộ lọc
        </Button>
        {selectedRows.length > 0 && (
          <Chip
            label={`${selectedRows.length} đã chọn`}
            color="primary"
            onDelete={() => onSelectionChange?.([])}
          />
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                    checked={data.length > 0 && selectedRows.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ fontWeight: 600 }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Hành động
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              const rowId = row.id || row.mssv || row.sessionId || index
              const isItemSelected = isSelected(rowId)

              return (
                <TableRow
                  hover
                  key={rowId}
                  selected={isItemSelected}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={() => handleSelectRow(rowId)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.format ? column.format(row[column.id]) : row[column.id]}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {actions.slice(0, 2).map((action, idx) => (
                          <Tooltip key={idx} title={action.label}>
                            <IconButton
                              size="small"
                              color={action.color || 'default'}
                              onClick={() => action.onClick(row)}
                            >
                              {action.icon}
                            </IconButton>
                          </Tooltip>
                        ))}
                        {actions.length > 2 && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, row)}
                          >
                            <MoreVert />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        labelRowsPerPage="Số dòng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {actions.slice(2).map((action, idx) => (
          <MenuItem key={idx} onClick={() => action.onClick(selectedRow)}>
            {action.icon}
            <Typography sx={{ ml: 1 }}>{action.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  )
}
