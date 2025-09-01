"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Divider,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import CategorySelection from "../../components/CategorySelection";
import Navbar from "../../components/Navbar";
import { Question, QuestionMetadata } from "../../types";

export default function CategoryPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const router = useRouter();

  useEffect(() => {
    const q = localStorage.getItem("questions");
    const m = localStorage.getItem("metadata");

    if (q && m) {
      setQuestions(JSON.parse(q));

      // Parse the metadata and ensure selection_settings exists
      const parsedMetadata = JSON.parse(m);
      if (!parsedMetadata.selection_settings) {
        parsedMetadata.selection_settings = {};
      }

      setMetadata(parsedMetadata);
    } else {
      router.replace("/");
    }
  }, [router]);
  const handleFilterQuestions = (filteredQuestions: Question[]) => {
    // Store the original full pool before filtering
    localStorage.setItem("allQuestions", JSON.stringify(questions));
    
    // Update the questions state with the filtered questions
    setQuestions(filteredQuestions);
    // Update localStorage with the filtered questions
    localStorage.setItem("questions", JSON.stringify(filteredQuestions));

    // Navigate to the edit page
    router.push("/edit");
  };

  const hasDuplicates = useMemo(() => questions.some(q => q.is_duplicate), [questions]);
  const duplicateGroupCount = useMemo(() => {
    const groups = new Set<number>();
    questions.forEach(q => { if (q.is_duplicate && q.duplicate_group_id) groups.add(q.duplicate_group_id); });
    return groups.size;
  }, [questions]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', color: '#222' }}>
      <Navbar />
      {/* Page content container that seamlessly connects with navbar */}
      <Box 
        sx={{ 
          backgroundColor: 'white',
          px: 4, 
          py: 0, // Remove top padding to connect with navbar
          pt: 4, // Add top padding back for content spacing
          pb: 4, // Add bottom padding back for content spacing
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography
            variant="h4"
            sx={{ color: "#1a1a1a", fontWeight: 700, mb: 2, fontFamily: "var(--sds-typography-title-hero-font-family)" }}
          >
            Select Categories
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "#666", fontWeight: 400, mb: 4, fontFamily: "var(--sds-typography-title-hero-font-family)" }}
          >
            Choose the number of questions from each category to include in your exam.
          </Typography>
          {hasDuplicates && (
            <Box sx={{
              mb: 4,
              p: 2.5,
              background: '#fffbe6',
              border: '1px solid #f5d36b',
              borderRadius: 2,
              color: '#795500'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Possible Duplicate Questions Detected
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: .5 }}>
                {duplicateGroupCount} duplicate group{duplicateGroupCount!==1?'s':''} identified. They will be highlighted during editing so you can decide which to keep or modify.
              </Typography>
            </Box>
          )}
          {metadata && (
          <Box
            sx={{
              background: 'rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.18)',
              p: 4,
              mb: 6,
            }}
          >
            <Typography variant="h5"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#1a1a1a",
                    fontFamily: "var(--sds-typography-title-hero-font-family)",
                }}>
              Exam Details
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 3
              }}
            >
              {[
                { label: "Year", value: metadata.year, key: "year" },
                { label: "Semester", value: metadata.semester, key: "semester" },
                { label: "Exam Type", value: metadata.exam_type, key: "exam_type" },
                {
                  label: "Exam Type Code",
                  value: metadata.exam_type_code,
                  key: "exam_type_code",
                  editable: false
                },
                { label: "Department", value: metadata.department, key: "department" },
                { label: "Program Type", value: metadata.program_type, key: "program_type" },
                { label: "Subject Code", value: metadata.subject_code, key: "subject_code" },
                { label: "Subject Name", value: metadata.subject_name, key: "subject_name" },
                { label: "Lecturer", value: metadata.lecturer, key: "lecturer" },
                { label: "Date", value: metadata.date, key: "date" },
                { label: "Time", value: metadata.time, key: "time" },
              ].map((item, i) => (
                <Box key={i}>
                  <Typography sx={{fontWeight:500, color:"#1a1a1a", fontSize:"16px"}} gutterBottom>
                    {item.label}
                  </Typography>
                  {item.editable === false ? (
                    <Typography variant="caption" color="#333">{item.value}</Typography>
                  ) : (
                    <TextField
                      fullWidth
                      sx={{
                        color: "#1a1a1a",
                        "& .MuiInputBase-input": {
                          color: "#333",
                          
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                          color: "#1a1a1a",
                        },
                      }}
                      size="small"
                      value={item.value}
                      onChange={(e) => {
                        const updatedMetadata = { ...metadata, [item.key]: e.target.value };
                        
                        // Update exam_type_code if year, semester, or exam_type is changed
                        if (item.key === 'year' || item.key === 'semester' || item.key === 'exam_type') {
                          updatedMetadata.exam_type_code = `${updatedMetadata.exam_type}_${updatedMetadata.semester}/${updatedMetadata.year}`;
                        }
                        
                        setMetadata(updatedMetadata);
                        localStorage.setItem("metadata", JSON.stringify(updatedMetadata));
                      }}
                      spellCheck={true}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )} 
        <Divider sx={{ my: 5, borderColor: "#e2e8f0" }} />
        {metadata && (
          <CategorySelection
            questions={questions}
            metadata={metadata}
            onChange={(updatedMetadata) => {
              setMetadata(updatedMetadata);
              localStorage.setItem("metadata", JSON.stringify(updatedMetadata));
            }}
            onFilterQuestions={handleFilterQuestions}
          />
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}
