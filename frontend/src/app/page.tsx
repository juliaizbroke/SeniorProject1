"use client";

import { Box, Button, Typography, Container, Grid, Paper } from "@mui/material";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function LandingPage() {
  const router = useRouter();

  return (
    <Box
      minHeight="100vh"
      sx={{
        bgcolor: "#e3e9f7",
        color: "#222",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Navbar />
      <Container
        maxWidth="md"
        sx={{
          mt: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box className="fade-in" sx={{ width: "100%" }}>
          <Typography variant="h2" fontWeight={700} sx={{ mb: 2, color: "#1a1a1a", textAlign: "center", letterSpacing: 1 }}>
            Welcome to Aurex
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, color: "#333", textAlign: "center", fontWeight: 400 }}>
            Smart. Secure. Effortless Exam Paper Generation.
          </Typography>
          <Typography variant="body1" sx={{ mb: 6, color: "#444", textAlign: "center", maxWidth: 600, mx: "auto" }}>
            Aurex streamlines the process of creating, managing, and securing exam papers for educators. Upload your exam data, customize your paper, and generate professional exams in minutes.
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
              Get Started
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
