"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Divider,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import Navbar from "../../components/Navbar";
import { getDownloadUrl } from "../../utils/api";
import { QuestionMetadata } from "../../types";

export default function PreviewPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [downloadLinks, setDownloadLinks] = useState<{ 
    exam_url: string; 
    key_url: string; 
    exam_preview_url?: string; 
    key_preview_url?: string; 
  } | null>(null);
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const examUrl = searchParams.get('examUrl');
    const keyUrl = searchParams.get('keyUrl');
    const examPreviewUrl = searchParams.get('examPreviewUrl');
    const keyPreviewUrl = searchParams.get('keyPreviewUrl');
    
    console.log('Preview page query params:', {
      examUrl,
      keyUrl,
      examPreviewUrl,
      keyPreviewUrl
    });
    
    if (examUrl && keyUrl) {
      const links = {
        exam_url: decodeURIComponent(examUrl),
        key_url: decodeURIComponent(keyUrl),
        exam_preview_url: examPreviewUrl ? decodeURIComponent(examPreviewUrl) : undefined,
        key_preview_url: keyPreviewUrl ? decodeURIComponent(keyPreviewUrl) : undefined
      };
      
      console.log('Setting download links:', links);
      console.log('Exam preview URL exists?', !!links.exam_preview_url);
      console.log('Key preview URL exists?', !!links.key_preview_url);
      
      // If no preview URLs are provided, try to construct them from the download URLs
      if (!links.exam_preview_url && links.exam_url) {
        // Convert download URL to preview URL
        links.exam_preview_url = links.exam_url.replace('/download/', '/preview/');
        console.log('Generated exam preview URL:', links.exam_preview_url);
      }
      
      if (!links.key_preview_url && links.key_url) {
        // Convert download URL to preview URL
        links.key_preview_url = links.key_url.replace('/download/', '/preview/');
        console.log('Generated key preview URL:', links.key_preview_url);
      }
      
      setDownloadLinks(links);
    }

    // Get metadata from localStorage
    const storedMetadata = localStorage.getItem("metadata");
    if (storedMetadata) {
      setMetadata(JSON.parse(storedMetadata));
    }
  }, [searchParams]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ bgcolor: "white", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ px: 4, py: 6 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: "#1e3a8a",
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            Preview Exam
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 400,
              mb: 4,
              color: "#64748b",
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            Preview your generated exam paper before downloading.
          </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Subject
            </Typography>
            <Typography color="#64748b">{metadata?.subject_name || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Lecturer
            </Typography>
            <Typography color="#64748b">{metadata?.lecturer || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Date
            </Typography>
            <Typography color="#64748b">{metadata?.date || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Duration
            </Typography>
            <Typography color="#64748b">{metadata?.time || "N/A"}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: "#e2e8f0" }} />

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              height: "35px",
              borderRadius: 8,
              margin: "5px 2px",
              backgroundColor: "#1e3a8a",
              transition: "all 0.3s ease-in-out",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            },
          }}
          sx={{
            mb: 2,
            bgcolor: "#f1f5f9",
            borderRadius: 2,
            minHeight: "20px",
            "& .MuiTabs-flexContainer": {
              position: "relative",
              zIndex: 1,
            },
            "& .MuiTab-root": {
              zIndex: 2,
            },
          }}
        >
          {["Exam Paper", "Answer Key"].map((label) => (
            <Tab
              key={label}
              label={label}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                minHeight: "unset",
                m: "2px 1px",
                height: "40px",
                borderRadius: 1,
                transition: "color 0.2s ease-in-out",
                color: "#64748b",
                "&.Mui-selected": {
                  color: "white",
                  fontWeight: 600,
                },
              }}
            />
          ))}
        </Tabs>

        <Box
          sx={{
            mt: 4,
            p: 4,
            bgcolor: "#f8fafc",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          {downloadLinks ? (
            <Box>
              {/* Debug information */}
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: '#666' }}>
                Current tab: {tabIndex === 0 ? 'Exam Paper' : 'Answer Key'}<br/>
                Preview URL available: {tabIndex === 0 ? (downloadLinks.exam_preview_url ? 'Yes' : 'No') : (downloadLinks.key_preview_url ? 'Yes' : 'No')}<br/>
                {downloadLinks.exam_preview_url && `Exam Preview: ${downloadLinks.exam_preview_url}`}<br/>
                {downloadLinks.key_preview_url && `Key Preview: ${downloadLinks.key_preview_url}`}
              </Typography>
              
              {/* Show iframe only if we have HTML preview URLs */}
              {(tabIndex === 0 && downloadLinks.exam_preview_url && downloadLinks.exam_preview_url.includes('_preview.html')) || 
               (tabIndex === 1 && downloadLinks.key_preview_url && downloadLinks.key_preview_url.includes('_preview.html')) ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
                    Loading HTML preview...
                  </Typography>
                  <iframe
                    src={`/api/proxy-preview/${
                      tabIndex === 0 
                        ? downloadLinks.exam_preview_url!.split('/').pop()
                        : downloadLinks.key_preview_url!.split('/').pop()
                    }`}
                    style={{ 
                      width: "100%", 
                      height: "600px", 
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px"
                    }}
                    title={tabIndex === 0 ? "Exam Paper Preview" : "Answer Key Preview"}
                    onLoad={(e) => {
                      console.log('Iframe loaded successfully');
                      const iframe = e.target as HTMLIFrameElement;
                      console.log('Iframe src:', iframe.src);
                    }}
                    onError={(e) => {
                      console.error('Iframe failed to load:', e);
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" gutterBottom>
                    {tabIndex === 0 ? "Exam Paper Preview" : "Answer Key Preview"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    HTML preview not available. The server is returning: {tabIndex === 0 ? downloadLinks.exam_preview_url : downloadLinks.key_preview_url}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (downloadLinks) {
                        const url = tabIndex === 0 ? downloadLinks.exam_url : downloadLinks.key_url;
                        window.open(getDownloadUrl(url), '_blank');
                      }
                    }}
                    sx={{
                      borderColor: "#1e3a8a",
                      color: "#1e3a8a",
                      "&:hover": {
                        borderColor: "#1e40af",
                        backgroundColor: "rgba(30,58,138,0.04)",
                      },
                    }}
                  >
                    Download {tabIndex === 0 ? "Exam Paper" : "Answer Key"}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="error" sx={{ textAlign: "center" }}>
              No preview available. Please ensure the files exist and try again.
            </Typography>
          )}
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}
        >
          <Button
            variant="contained"
            onClick={() => {
              if (downloadLinks) {
                window.open(getDownloadUrl(downloadLinks.exam_url), '_blank');
              }
            }}
            disabled={!downloadLinks}
            sx={{
              height: "60px",
              flexShrink: 0,
              borderRadius: "10px",
              border: "1px solid #1e3a8a",
              backgroundColor: "#1e3a8a",
              color: "white",
              "&:hover": {
                backgroundColor: "#1e40af",
              },
            }}
          >
            Download Exam Paper
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (downloadLinks) {
                window.open(getDownloadUrl(downloadLinks.key_url), '_blank');
              }
            }}
            disabled={!downloadLinks}
            sx={{
              height: "60px",
              flexShrink: 0,
              borderRadius: "10px",
              border: "1px solid #1e3a8a",
              backgroundColor: "#1e3a8a",
              color: "white",
              "&:hover": {
                backgroundColor: "#1e40af",
              },
            }}
          >
            Download Answer Key
          </Button>
        </Box>
        </Box>
      </Box>
    </Box>
  );
}