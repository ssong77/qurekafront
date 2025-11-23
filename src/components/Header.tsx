// src/components/Header.tsx
import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AccountCircle from '@mui/icons-material/AccountCircle'
import MenuIcon from '@mui/icons-material/Menu'
import LogoImage from '../assets/images/큐레카_로고 이미지.png' 
import { Avatar } from '@mui/material'
import { Chip } from '@mui/material'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, logout, user} = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
 
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
  }
  const handleLogout = () => {
    logout()
    handleMenuClose()
    setMobileMenuOpen(false)
    navigate('/')
  }
  const handleMypage = () => {
    handleMenuClose()
    setMobileMenuOpen(false)
    navigate('/mypage')
  }

  const handleNavigation = (path: string) => {
    // 현재 경로와 같은 경로를 클릭한 경우 새로고침
    if (location.pathname === path) {
      window.location.reload()
    } else {
      navigate(path)
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <AppBar position="static" color="transparent" elevation={3}>
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          paddingTop: 1.5,
          paddingBottom: 1.5
        }}>
          {/* 로고 */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleNavigation('/')}
          >
            <img
              src={LogoImage}
              alt="큐레카 로고"
              style={{ height: isMobile ? 50 : 60, marginRight: 8 }}
            />
          </Box>

          {/* 데스크톱 메뉴 */}
          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="text"
                onClick={() => handleNavigation('/')}
                sx={{ textTransform: 'none', mr: 2, fontSize: '1.3rem' }}
                data-navigation="true"
              >
                홈
              </Button>
              <Button
                variant="text"
                onClick={() => handleNavigation('/upload')}
                sx={{ textTransform: 'none', mr: 2, fontSize: '1.3rem' }}
                data-navigation="true"
              >
                실습하기
              </Button>
              <Button
                variant="text"
                onClick={() => handleNavigation('/solve-questions')}
                sx={{ textTransform: 'none', mr: 2, fontSize: '1.3rem' }}
                data-navigation="true"
              >
                문제 풀기
              </Button>

              {isLoggedIn ? (
                <>
                  <Chip
                    label={user?.name || '사용자'}
                    onClick={handleMenuOpen}
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </Avatar>
                    }
                    variant="outlined"
                    clickable
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      color: 'black',
                      borderColor: 'white',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'white',
                        color: 'black'
                      }
                    }}
                  />
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleMypage}>마이페이지</MenuItem>
                    <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    fontSize: '1.1rem',
                    py: 0.5,  
                    height: 'auto'  
                  }} 
                >
                  로그인
                </Button>
              )}
            </Box>
          ) : (
            // 모바일 햄버거 메뉴
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ ml: 2 }}
            >
              <MenuIcon sx={{ fontSize: '2rem' }} />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* 모바일 Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            {isLoggedIn && (
              <>
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {user?.name || '사용자'}
                    </Typography>
                  </Box>
                </ListItem>
                <Divider />
              </>
            )}
            
            <ListItemButton onClick={() => handleNavigation('/')} data-navigation="true">
              <ListItemText primary="홈" primaryTypographyProps={{ fontSize: '1.1rem' }} />
            </ListItemButton>
            
            <ListItemButton onClick={() => handleNavigation('/upload')} data-navigation="true">
              <ListItemText primary="실습하기" primaryTypographyProps={{ fontSize: '1.1rem' }} />
            </ListItemButton>
            
            <ListItemButton onClick={() => handleNavigation('/solve-questions')} data-navigation="true">
              <ListItemText primary="문제 풀기" primaryTypographyProps={{ fontSize: '1.1rem' }} />
            </ListItemButton>
            
            {isLoggedIn && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={handleMypage}>
                  <ListItemText primary="마이페이지" primaryTypographyProps={{ fontSize: '1.1rem' }} />
                </ListItemButton>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary="로그아웃" primaryTypographyProps={{ fontSize: '1.1rem', color: 'error.main' }} />
                </ListItemButton>
              </>
            )}
            
            {!isLoggedIn && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={() => handleNavigation('/login')}>
                  <ListItemText primary="로그인" primaryTypographyProps={{ fontSize: '1.1rem', color: 'primary.main' }} />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  )
}
