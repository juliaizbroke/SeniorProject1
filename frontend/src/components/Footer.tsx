import React from 'react';
import { Box, Typography, Container, Grid } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1e3a8a',
        color: 'white',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
              Contact & Support
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>Email:</strong><br />[your.email@university.edu]
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>GitHub:</strong><br />[github.com/your-repo]
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>Documentation:</strong><br />See User Manual
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            © {new Date().getFullYear()} Aurex Exam Generation System | Academic Project | All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;