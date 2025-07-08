import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface FileSelectProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileSelectProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        bgcolor: '#e3e9f7',
        border: '2px dashed #b0b8c9',
        color: '#1a1a1a',
        boxShadow: '0 2px 8px rgba(30,58,138,0.04)',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: '#1e3a8a',
          backgroundColor: '#d2ddfa',
        },
      }}
    >
      <input {...getInputProps()} />
      <Box sx={{ color: 'text.secondary' }}>
        <DescriptionIcon sx={{ fontSize: 48, mb: 2 }} />
        {isDragActive ? (
          <Typography variant="body1">
            Drop the Excel file here...
          </Typography>
        ) : (
          <Box>
            <Typography variant="body1" sx={{color: "#1E1E1E" }}>
              Drag and drop your Excel file here
            </Typography>
            <Typography variant="body2" sx={{mb: 1, color: "#757575" }} >
              or click to browse your file
            </Typography>
            <Typography variant="body2" color="#757575">
              (Only .xlsx or .xls files are accepted)
            </Typography>
          </Box>  
        )}
      </Box>
    </Paper>
  );
} 