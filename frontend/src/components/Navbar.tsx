import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Modal, Backdrop, Fade } from '@mui/material';
import Image from 'next/image';

const Navbar: React.FC = () => {
  // State for disclaimer modal
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Modal handlers
  const handleDisclaimerOpen = () => {
    setDisclaimerOpen(true);
  };

  const handleDisclaimerClose = () => {
    setDisclaimerOpen(false);
  };

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
            <Button
              onClick={handleDisclaimerOpen}
              sx={{ 
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Disclaimer
            </Button>
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

      {/* Disclaimer Modal */}
      <Modal
        open={disclaimerOpen}
        onClose={handleDisclaimerClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={disclaimerOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 },
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflow: 'auto'
          }}>
            <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700, color: '#1e3a8a' }}>
              Disclaimer
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              <strong>Academic Use Only:</strong> Aurex Exam Generation System is intended solely for educational institutions and academic purposes. It is designed to assist educators in creating and managing examination papers.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              <strong>No Warranty:</strong> This software is provided “as is” without any express or implied warranties, including but not limited to accuracy, reliability, or fitness for a particular purpose.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              <strong>User Responsibility:</strong> Users are solely responsible for reviewing and validating all generated content to ensure accuracy, appropriateness, and compliance with institutional policies.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              <strong>Data Privacy:</strong> The system runs entirely on the user’s local machine and does not connect to external servers. Users are responsible for safeguarding their environment and ensuring that any uploaded data complies with institutional privacy and data protection requirements.
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
              <strong>Limitation of Liability:</strong> The developers shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use or misuse of this software.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDisclaimerClose}
                style={{
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Navbar;
