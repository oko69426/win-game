import { createTheme } from '@mui/material/styles';

// WINGAME - AI Sports Analytics
// Brand: Deep Navy #0A1628 | Electric Blue #0066FF | Cyan #00D4FF | Green #00C853 | Red #F43B30 | Yellow #FFB300
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0066FF',
      light: '#00D4FF',
      dark: '#0A1628',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00C853',
      light: '#00E676',
      dark: '#009624',
    },
    background: {
      default: '#0A1628',
      paper: '#141F2E',
    },
    success: { main: '#00C853' },
    error: { main: '#F43B30' },
    warning: { main: '#FFB300' },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.55)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.7 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#141F2E',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          fontSize: '0.95rem',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #0A1628 0%, #0066FF 55%, #00C853 100%)',
          color: '#fff',
          boxShadow: '0 0 20px rgba(0,102,255,0.35)',
          '&:hover': {
            boxShadow: '0 0 35px rgba(0,102,255,0.6)',
            filter: 'brightness(1.08)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(0,102,255,0.4)',
          color: '#0066FF',
          '&:hover': {
            borderColor: '#0066FF',
            backgroundColor: 'rgba(0,102,255,0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.07)',
        },
        bar: {
          background: 'linear-gradient(90deg, #0A1628, #0066FF)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.08)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,22,40,0.92)',
          borderBottom: '1px solid rgba(0,102,255,0.15)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
  },
});

export default theme;
