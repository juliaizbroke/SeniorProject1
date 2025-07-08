"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Alert,
  Card,
  CardContent,
  Link,
  Button,
  Grid,
} from "@mui/material";
import FileUpload from "../../components/FileUpload";
import Navbar from "../../components/Navbar";
import { uploadExcel } from "../../utils/api";
import { UploadResponse } from "../../types";

export default function HomePage() {
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError("");
      const response: UploadResponse = await uploadExcel(selectedFile);
      localStorage.setItem("questions", JSON.stringify(response.questions));
      localStorage.setItem("metadata", JSON.stringify(response.metadata));
      localStorage.setItem("sessionId", response.session_id);
      router.push("/category");
    } catch (err) {
      setError(
        "Failed to upload file. Please make sure it follows the correct format."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" sx={{ bgcolor: "#e3e9f7", color: "#222", position: "relative", overflow: "hidden" }}>
      <Navbar />
      <Box py={6} sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ px: 13 }}>
          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5 }}>
                Upload Excel File
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5 }}>
                Upload your Excel file containing exam data
              </Typography>
            </Grid>
            <Grid item>
              <Link href="/template.xlsx" underline="hover" fontWeight="bold" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.5, letterSpacing: 0.5 }}>
                Download Excel Template
              </Link>
            </Grid>
          </Grid>
        </Box>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Card className="glassy-card"
          sx={{
            background: 'rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.18)',
            p: 4,
            mb: 6,
          }}>
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#1a1a1a" }}>
                  Requirements
                </Typography>
                <ul style={{ marginLeft: "1rem", fontSize: "0.875rem" }}>
                  <li>Sheet 1: Exam metadata (subject, lecturer, date, etc.)</li>
                  <li>Sheet 2: Multiple Choice Questions</li>
                  <li>Sheet 3: True/False</li>
                  <li>Sheet 4: Matching</li>
                  <li>Sheet 5: Short/Long Questions</li>
                </ul>
              </Box>
              {/* File Upload */}
              <Box mb={3}>
                <FileUpload onFileSelect={setSelectedFile} />
              </Box>
              {/* Upload Button */}
              <Box textAlign="center">
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ height: "48px", textTransform: "none", bgcolor: "#1e3a8a", color: "#fff", fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: "#12264a" } }}
                  disabled={!selectedFile || loading}
                  onClick={handleUpload}
                >
                  {loading ? "Processing..." : "Upload and Process"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
} 