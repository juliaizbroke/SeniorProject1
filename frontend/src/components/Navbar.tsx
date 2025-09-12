import React from 'react';
import { AppBar, Toolbar, Typography, Box} from '@mui/material';

const Navbar: React.FC = () => {
  // const router = useRouter(); // Using Link components instead
  //const pathname = usePathname();

  // const getActiveStep = () => {
  //   switch (pathname) {
  //     case '/': return 0;
  //     case '/category': return 1;
  //     case '/edit': return 2;
  //     case '/preview': return 3;
  //     default: return 0;
  //   }
  // };

  // const steps = [
  //   { label: 'Upload', path: '/home', disabled: false },
  //   { label: 'Select Categories', path: '/category', disabled: false },
  //   { label: 'Edit', path: '/edit', disabled: false },
  //   { label: 'Preview', path: '/preview', disabled: false },
  // ];

  //const activeStep = getActiveStep();

  //const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    //if (!steps[newValue].disabled) {
      //router.push(steps[newValue].path);
    //}
  //};

  return (
    <Box sx={{ position: 'relative' }}>
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#1e3a8a', // Navy blue as requested
          boxShadow: 'none',
          px: 0
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 4, minHeight: '56px' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }}
            onClick={() => window.location.href = '/'}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                fontFamily: "var(--sds-typography-title-hero-font-family)",
              }}
            >
              Aurex
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

        {/* Breadcrumb Navigation */}
        {/* <Box sx={{ 
          px: 4, 
          position: 'relative',
          height: '40px', // Reduced height
        }}>
          <Tabs
            value={activeStep}
            onChange={handleTabChange}
            variant="fullWidth"
            TabIndicatorProps={{
              style: { display: 'none' } // Hide default indicator
            }}
            sx={{
              minHeight: '40px', // Reduced height
              height: '40px',
              '& .MuiTabs-flexContainer': {
                height: '40px',
              },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                minHeight: '40px',
                height: '40px',
                position: 'relative',
                zIndex: 2,
                borderTopLeftRadius: '12px', // Curved corners
                borderTopRightRadius: '12px', // Curved corners
                margin: '0 2px', // Small gap between tabs
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                '&.Mui-selected': {
                  color: '#1e3a8a',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'white',
                    zIndex: 3,
                  }
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              },
            }}
          >
            {steps.map((step) => (
              <Tab
                key={step.label}
                label={step.label}
                disabled={step.disabled}
              />
            ))}
          </Tabs>
        </Box> */}
      </AppBar>
    </Box>
  );
};

export default Navbar;
