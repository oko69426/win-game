import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  AppBar, Toolbar, Typography, Box, Container,
  Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText,
  CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HistoryIcon from '@mui/icons-material/History';
import BoltIcon from '@mui/icons-material/Bolt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScienceIcon from '@mui/icons-material/Science';
import MenuIcon from '@mui/icons-material/Menu';

import theme from './theme';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import History from './pages/History';
import Footer from './components/Footer';

const Performance = lazy(() => import('./pages/Performance'));
const Methodology = lazy(() => import('./pages/Methodology'));
const DailyPicks = lazy(() => import('./pages/DailyPicks'));

const NAV_ITEMS = [
  { path: '/', label: '首頁', icon: <HomeIcon sx={{ fontSize: 18 }} /> },
  { path: '/analysis', label: 'AI 分析', icon: <CameraAltIcon sx={{ fontSize: 18 }} /> },
  { path: '/history', label: '歷史記錄', icon: <HistoryIcon sx={{ fontSize: 18 }} /> },
  { path: '/daily-picks', label: '每日精選', icon: <BoltIcon sx={{ fontSize: 18 }} /> },
  { path: '/performance', label: '預測績效', icon: <AssessmentIcon sx={{ fontSize: 18 }} /> },
  { path: '/methodology', label: '方法論', icon: <ScienceIcon sx={{ fontSize: 18 }} /> },
];

function NavBar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, md: 4 }, minHeight: { xs: 56, md: 64 } }}>
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          display="flex"
          alignItems="center"
          gap={1.2}
          mr={{ xs: 0, md: 4 }}
          sx={{ textDecoration: 'none', flexShrink: 0 }}
        >
          {/* WINGAME Logo */}
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0A1628, #0066FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(0,102,255,0.45)',
              flexShrink: 0,
            }}
          >
            <img
              src="/brand-assets/wingame-icon.svg"
              alt=""
              style={{ width: 24, height: 22, filter: 'brightness(0) invert(1)', display: 'block' }}
            />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '0.06em',
                background: 'linear-gradient(90deg, #0066FF 0%, #00D4FF 60%, #00C853 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                lineHeight: 1.1,
              }}
            >
              WINGAME
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.55rem', letterSpacing: '0.14em', lineHeight: 1 }}>
              AI SPORTS ANALYTICS
            </Typography>
          </Box>
        </Box>

        {/* Desktop Nav Links */}
        <Box display={{ xs: 'none', lg: 'flex' }} gap={0.5} flexGrow={1}>
          {NAV_ITEMS.map(({ path, label, icon }) => {
            const active = location.pathname === path;
            return (
              <Button
                key={path}
                component={Link}
                to={path}
                startIcon={icon}
                sx={{
                  color: active ? '#0066FF' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.88rem',
                  px: 1.8,
                  py: 0.8,
                  borderRadius: '8px',
                  background: active ? 'rgba(0,102,255,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(0,102,255,0.25)' : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(0,102,255,0.06)',
                    color: '#0066FF',
                    border: '1px solid rgba(0,102,255,0.2)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        {/* Beta Badge */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            ml: 2,
            px: 1.5,
            py: 0.4,
            borderRadius: '20px',
            border: '1px solid rgba(0,102,255,0.25)',
            background: 'rgba(0,102,255,0.06)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#0066FF', fontWeight: 700, letterSpacing: '0.08em' }}>
            BETA
          </Typography>
        </Box>

        {/* Mobile spacer + Menu Button */}
        <Box flexGrow={1} display={{ xs: 'flex', lg: 'none' }} justifyContent="flex-end">
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: '#0066FF', p: 1 }}
            aria-label="開啟選單"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            background: '#0A1628',
            borderLeft: '1px solid rgba(0,102,255,0.15)',
            width: 240,
          }
        }}
      >
        <Box p={2.5}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '7px',
              background: 'linear-gradient(135deg, #0A1628, #0066FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,102,255,0.4)',
            }}>
              <img
                src="/brand-assets/wingame-icon.svg"
                alt=""
                style={{ width: 18, height: 16, filter: 'brightness(0) invert(1)', display: 'block' }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{
                fontWeight: 900, letterSpacing: '0.06em',
                background: 'linear-gradient(90deg, #0066FF, #00C853)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
              }}>
                WINGAME
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', letterSpacing: '0.12em' }}>
                AI SPORTS ANALYTICS
              </Typography>
            </Box>
          </Box>
          <List disablePadding>
            {NAV_ITEMS.map(({ path, label, icon }) => (
              <ListItem disablePadding key={path}>
                <ListItemButton
                  component={Link}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    px: 2,
                    py: 1.2,
                    color: location.pathname === path ? '#0066FF' : 'rgba(255,255,255,0.6)',
                    background: location.pathname === path ? 'rgba(0,102,255,0.08)' : 'transparent',
                    border: location.pathname === path ? '1px solid rgba(0,102,255,0.2)' : '1px solid transparent',
                    '& .MuiSvgIcon-root': { mr: 1.5, fontSize: 18 },
                  }}
                >
                  {icon}
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === path ? 700 : 400 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

function PageLoader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress sx={{ color: '#0066FF' }} />
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box minHeight="100vh" bgcolor="background.default" display="flex" flexDirection="column">
          <NavBar />
          <Box flex={1}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/analysis"
                  element={
                    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
                      <Analysis />
                    </Container>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
                      <History />
                    </Container>
                  }
                />
                <Route
                  path="/daily-picks"
                  element={
                    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
                      <DailyPicks />
                    </Container>
                  }
                />
                <Route
                  path="/performance"
                  element={
                    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
                      <Performance />
                    </Container>
                  }
                />
                <Route
                  path="/methodology"
                  element={
                    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
                      <Methodology />
                    </Container>
                  }
                />
              </Routes>
            </Suspense>
          </Box>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
