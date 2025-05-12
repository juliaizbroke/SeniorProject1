import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadProps {
  onUpload: (file: File) => void;
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
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

export default function FileUpload({ onUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

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
        <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
        {isDragActive ? (
          <Typography variant="body1">
            Drop the Excel file here...
          </Typography>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Drag and drop your Excel file here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Only .xlsx or .xls files are accepted)
            </Typography>
          </Box>
        )}
      </Box>
    </UploadBox>
  );
} 