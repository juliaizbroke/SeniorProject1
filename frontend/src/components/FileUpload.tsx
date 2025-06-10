import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';

interface FileSelectProps {
  onFileSelect: (file: File) => void;
}

const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  border: '2px dashed',
  borderColor: theme.palette.divider,
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: "#1E1E1E",
    backgroundColor: theme.palette.action.hover,
  },
}));

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
    <UploadBox
      {...getRootProps()}
      sx={{
        borderColor: isDragActive ? 'primary.main' : 'divider',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
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
    </UploadBox>
  );
} 