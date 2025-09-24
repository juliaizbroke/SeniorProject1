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
                  <strong>Email: </strong>
                  <a
                    href="mailto:u6530213@au.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Julia
                  </a>, <a
                    href="mailto:u6530203@au.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Desmond
                  </a>, <a
                    href="mailto:u6530207@au.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Harry
                  </a>
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>GitHub: </strong>
                  <a
                    href="https://github.com/juliaizbroke/SeniorProject1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    View GitHub Repository
                  </a>
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>Documentation: </strong>
                  <a
                    href="https://github.com/juliaizbroke/SeniorProject1/blob/master/Aurex%20Exam%20Generator%20-%20User%20Manual.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    See User Manual
                  </a>
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