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
import FileUpload from "../components/FileUpload";
import Navbar from "../components/Navbar";
import { uploadExcel } from "../utils/api";
import { UploadResponse } from "../types";

export default function LandingPage() {
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
    <Box minHeight="100vh" bgcolor="#f8fafc">
      <Navbar />
      <Box py={6}>
      <Box
      sx={{
        px: 13,
      }}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Grid item>
            <Typography variant="h4"
            sx={{
              color: "#000",
              fontFamily: "var(--sds-typography-title-hero-font-family)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 0.5,
            }}
            >
              Upload Excel File
            </Typography>
            <Typography 
            sx={{
              fontSize: "15px",
              color: "#757575",
              fontFamily: "var(--sds-typography-body-font-family)",
              fontWeight: 400,
              lineHeight: 1.5,
            }}
            >
              Upload your Excel file containing exam data
            </Typography>
          </Grid>
          <Grid item>
            <Link href="/template.xlsx" underline="hover" fontWeight="bold"
            sx={{
              color: "#000",
              fontFamily: "var(--sds-typography-body-font-family)",
              fontWeight: 700,
              lineHeight: 1.5,
              letterSpacing: 0.5,
            }}
            >
              Download Excel Template
            </Link>
          </Grid>
        </Grid>
      </Box>
      <Container>
        <Card>
          <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box mb={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
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
                sx={{ height: "48px", textTransform: "none" }}
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
