"use client";

import { useEffect, useState } from "react";
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

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh", px: 4, py: 6 }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: "#000",
            fontFamily: "var(--sds-typography-title-hero-font-family)",
          }}
        >
          Edit Exam Metadata & Select Questions by Category
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 400,
            mb: 4,
            color: "#757575",
            fontFamily: "var(--sds-typography-title-hero-font-family)",
          }}
        >
          Choose the number of questions from each category to include in your exam.
        </Typography>
          {metadata && (
          <Box
            sx={{ bgcolor: "#fff", p: 4, borderRadius: 2, mb: 6, boxShadow: 1}}
          >
            <Typography variant="h5"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#000",
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
                  value: `${metadata.exam_type}_${metadata.semester}/${metadata.year}`,
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
                  <Typography  sx={{fontWeight:300, color:"#000", fontSize:"17px"}} gutterBottom>
                    {item.label}
                  </Typography>
                  {item.editable === false ? (
                    <Typography variant="caption" color="text.primary">{item.value}</Typography>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      value={item.value}
                      onChange={(e) => {
                        const updatedMetadata = { ...metadata, [item.key]: e.target.value };
                        setMetadata(updatedMetadata);
                        localStorage.setItem("metadata", JSON.stringify(updatedMetadata));
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )} 
        <Divider sx={{ my: 5}} />
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
        <Divider sx={{ my: 10}} />
      </Box>
    </Box>
  );
}
