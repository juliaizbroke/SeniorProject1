"use client";

import { Box, Button, Typography, Container, Grid, Paper } from "@mui/material";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FindInPageIcon from '@mui/icons-material/FindInPage';

export default function LandingPage() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', color: '#222' }}>
      <Navbar />
      {/* Page content container that seamlessly connects with navbar */}
      <Box 
        sx={{ 
          backgroundColor: 'white',
          minHeight: 'calc(100vh - 96px)', // Account for smaller navbar height
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            pt: 6,
            pb: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 160px)",
          }}
        >
        <Box className="fade-in" sx={{ width: "100%" }}>
          <Typography variant="h1" fontWeight={800} sx={{ mb: 3, color: "#1a1a1a", textAlign: "center", letterSpacing: -1, fontSize: { xs: '3rem', md: '4rem' } }}>
            Aurex
          </Typography>
          <Typography variant="h4" sx={{ mb: 4, color: "#1e3a8a", textAlign: "center", fontWeight: 600 }}>
            Smart • Secure • Effortless
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, color: "#444", textAlign: "center", maxWidth: 700, mx: "auto", lineHeight: 1.6, fontWeight: 400 }}>
            Transform your exam creation process with Aurex. From question banks to similarity checking, 
            we provide comprehensive tools for educators to create, manage, and secure professional assessments.
          </Typography>
          {/* Feature Highlights */}
          <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ bgcolor: "transparent", textAlign: "center", p: 2 }}>
                <Box className="feature-icon">
                  <SecurityIcon/>
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: "#1a1a1a" }}>Secure</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>Your data and exams are protected with industry-leading security.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ bgcolor: "transparent", textAlign: "center", p: 2 }}>
                <Box className="feature-icon">
                  <SpeedIcon />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: "#1a1a1a" }}>Fast</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>Generate and customize exam papers in just a few clicks.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ bgcolor: "transparent", textAlign: "center", p: 2 }}>
                <Box className="feature-icon">
                  <AutoAwesomeIcon />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: "#1a1a1a" }}>Effortless</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>Intuitive interface designed for educators and admins.</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#1e3a8a",
                color: "#fff",
                fontWeight: 700,
                px: 6,
                py: 2,
                fontSize: "1.2rem",
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(10,25,49,0.2)",
                textTransform: "none",
                transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)",
                '&:hover': {
                  bgcolor: "#12264a",
                  transform: "scale(1.05)",
                  boxShadow: "0 8px 32px rgba(18,38,74,0.25)",
                },
              }}
              onClick={() => router.push("/home")}
            >
              Let&apos;s Get Started!
            </Button>
          </Box>

          {/* Similarity Checking Section */}
          <Box sx={{ mt: 12, mb: 8 }}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Box className="feature-icon" sx={{ mb: 3 }}>
                <FindInPageIcon sx={{ fontSize: 64, color: "#1e3a8a" }} />
              </Box>
              <Typography variant="h2" fontWeight={700} sx={{ mb: 3, color: "#1a1a1a", letterSpacing: -0.5 }}>
                Similarity Checking
              </Typography>
              <Typography variant="h6" sx={{ mb: 6, color: "#555", maxWidth: 800, mx: "auto", lineHeight: 1.6, fontWeight: 400 }}>
                Maintain exam integrity with intelligent similarity detection. Compare multiple exam papers 
                to identify duplicates, ensure consistency, and uphold academic standards across all assessments.
              </Typography>
            </Box>

            {/* How It Works */}
            <Typography variant="h4" fontWeight={600} sx={{ mb: 6, color: "#1a1a1a", textAlign: "center" }}>
              How It Works
            </Typography>
            <Grid container spacing={6} sx={{ mb: 8 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: "50%", 
                    bgcolor: "#1e3a8a", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    mx: "auto", 
                    mb: 3 
                  }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>1</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: "#1a1a1a" }}>Upload Papers</Typography>
                  <Typography variant="body1" sx={{ color: "#555", lineHeight: 1.6 }}>
                    Upload multiple exam papers in PDF, DOCX, or XLSX format for comprehensive comparison
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: "50%", 
                    bgcolor: "#1e3a8a", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    mx: "auto", 
                    mb: 3 
                  }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>2</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: "#1a1a1a" }}>Analyze Content</Typography>
                  <Typography variant="body1" sx={{ color: "#555", lineHeight: 1.6 }}>
                    Advanced algorithms analyze text patterns, structure, and content similarity
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: "50%", 
                    bgcolor: "#1e3a8a", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    mx: "auto", 
                    mb: 3 
                  }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>3</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: "#1a1a1a" }}>Get Results</Typography>
                  <Typography variant="body1" sx={{ color: "#555", lineHeight: 1.6 }}>
                    Receive detailed similarity reports with highlighted matches and insights
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Key Features */}
            <Typography variant="h4" fontWeight={600} sx={{ mb: 6, color: "#1a1a1a", textAlign: "center" }}>
              Key Features
            </Typography>
            <Grid container spacing={6} sx={{ mb: 8, maxWidth: 900, mx: "auto" }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Content Similarity Detection</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Multiple File Format Support</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Batch Processing Capabilities</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Customizable Similarity Thresholds</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Detailed Analysis Reports</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "#1e3a8a", borderRadius: "50%", mr: 3 }}></Box>
                  <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}>Export Functionality</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: "#1e3a8a",
                  color: "#fff",
                  fontWeight: 700,
                  px: 8,
                  py: 3,
                  fontSize: "1.3rem",
                  borderRadius: 3,
                  textTransform: "none",
                  boxShadow: "0 6px 24px rgba(30,58,138,0.3)",
                  transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                  '&:hover': {
                    bgcolor: "#12264a",
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 40px rgba(18,38,74,0.4)",
                  },
                }}
                onClick={() => router.push("/similarity")}
              >
                Start Similarity Check
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
      </Box>
    </Box>
  );
}
