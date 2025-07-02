import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const router = useRouter();

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#1e3a8a', // Navy blue
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
          onClick={() => router.push('/')}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            ExamGen
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            Exam Generation System
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
