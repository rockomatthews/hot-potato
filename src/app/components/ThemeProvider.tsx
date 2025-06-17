'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF6B35',
      light: '#FF8C42',
      dark: '#E5502A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF8C42',
      light: '#FF9A56',
      dark: '#E6732F',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0F0F0F',
      paper: 'rgba(20, 20, 20, 0.9)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    error: {
      main: '#FF4757',
      light: '#FF6B7A',
      dark: '#E03147',
    },
    warning: {
      main: '#FFB366',
      light: '#FFC592',
      dark: '#E69A4D',
    },
    info: {
      main: '#4ECDC4',
      light: '#6ED8D1',
      dark: '#3BA39C',
    },
    success: {
      main: '#26D0CE',
      light: '#4DD8D6',
      dark: '#1FB5B3',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
    h1: {
      fontSize: '4rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9A56 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#ffffff',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#ffffff',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 107, 53, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 53, 0.2)',
            borderColor: 'rgba(255, 107, 53, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '12px 24px',
          transition: 'all 0.3s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #E5502A 0%, #E6732F 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 107, 53, 0.4)',
          color: '#FF8C42',
          borderWidth: '2px',
          '&:hover': {
            borderColor: '#FF8C42',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 107, 53, 0.15)',
          color: '#FF8C42',
          border: '1px solid rgba(255, 107, 53, 0.3)',
          fontWeight: '600',
          '&:hover': {
            backgroundColor: 'rgba(255, 107, 53, 0.25)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          height: '8px',
        },
        bar: {
          background: 'linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)',
          borderRadius: '8px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(38, 208, 206, 0.15)',
          borderColor: 'rgba(38, 208, 206, 0.3)',
          color: '#26D0CE',
        },
        standardError: {
          backgroundColor: 'rgba(255, 71, 87, 0.15)',
          borderColor: 'rgba(255, 71, 87, 0.3)',
          color: '#FF4757',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 179, 102, 0.15)',
          borderColor: 'rgba(255, 179, 102, 0.3)',
          color: '#FFB366',
        },
        standardInfo: {
          backgroundColor: 'rgba(78, 205, 196, 0.15)',
          borderColor: 'rgba(78, 205, 196, 0.3)',
          color: '#4ECDC4',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 107, 53, 0.05)',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: 'rgba(255, 107, 53, 0.3)',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 107, 53, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF8C42',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#FF8C42',
            },
          },
          '& input': {
            color: '#ffffff',
          },
        },
      },
    },
  },
});

export default function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
