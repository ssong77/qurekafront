import React, { useState } from 'react'
import {
  Box, Typography, Paper,
  IconButton, Menu, MenuItem, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { FileItem, QuestionItem } from '../../types/mypage'

const itemsPerPage = 5

interface FileListSectionProps {
  title: string
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  items: FileItem[] | QuestionItem[]
  currentPage: number
  onPageChange: (e: React.ChangeEvent<unknown>, p: number) => void
  onView: (item: FileItem | QuestionItem) => void
  onDelete?: (item: FileItem | QuestionItem) => void
  onDownload: (item: FileItem | QuestionItem) => void
  onRename?: (item: FileItem | QuestionItem) => void
}

export default function FileListSection({
  title, titleVariant = 'h6', items, currentPage, onPageChange, onView, onDelete, onDownload, onRename
}: FileListSectionProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [activeItem, setActiveItem] = useState<FileItem | QuestionItem | null>(null)
  const openMenu = Boolean(anchorEl)

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: FileItem | QuestionItem) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
    setActiveItem(item)
  }
  
  const handleMenuClose = () => {
    setAnchorEl(null)
    setActiveItem(null)
  }

  const handleDownload = () => {
    if (!activeItem) return
    
    try {
      onDownload(activeItem)
      handleMenuClose()
    } catch (error) {
      console.error('다운로드 중 오류:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const start = (currentPage - 1) * itemsPerPage
  const pageItems = items.slice(start, start + itemsPerPage)
  const total = Math.ceil(items.length / itemsPerPage)

  return (
    <Box mb={6}>
      <Typography variant={titleVariant} fontWeight="bold" gutterBottom>{title}</Typography>
      <TableContainer component={Paper}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>{title.includes('요약') ? '요약본 이름' : '문제 이름'}</TableCell>
              <TableCell>파일 이름</TableCell>
              <TableCell align="center">생성 날짜</TableCell>
              <TableCell align="center">유형</TableCell>
              <TableCell align="right" sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map(item => (
              <TableRow key={item.id} hover onClick={() => onView(item)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <Box sx={{ display:'flex', alignItems:'center' }}>
                    <PictureAsPdfIcon color="error" sx={{ mr:1 }} />
                    <Typography noWrap fontWeight="medium">{item.displayName}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography noWrap variant="body2" color="text.secondary">
                    {item.name}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">{item.createdAt}</Typography>
                </TableCell>
                <TableCell align="center">
                  {title.includes('요약') ? (
                    <Chip 
                      label={(item as FileItem).summaryType || '기본 요약'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      label={(item as QuestionItem).displayType || '기타'} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMenuOpen(e, item)
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">저장된 항목이 없습니다.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {total > 0 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination 
            count={total} 
            page={currentPage}
            onChange={onPageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        disableAutoFocusItem
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={(e) => {
          e.stopPropagation()
          if (activeItem) {
            onView(activeItem)
          }
          handleMenuClose()
        }}>
          보기
        </MenuItem>
        
        <MenuItem onClick={(e) => {
          e.stopPropagation()
          handleDownload()
        }}>
          PDF 다운로드
        </MenuItem>
        
        {onRename && activeItem && (
          <MenuItem onClick={(e) => {
            e.stopPropagation()
            onRename(activeItem)
            handleMenuClose()
          }}>
            이름 변경
          </MenuItem>
        )}
        
        {onDelete && activeItem && (
          <MenuItem onClick={(e) => {
            e.stopPropagation()
            onDelete(activeItem)
            handleMenuClose()
          }}>
            삭제
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}