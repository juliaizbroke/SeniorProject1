import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadItem {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onFileUpload?: (file: File) => Promise<void>;
  showProgress?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  onFileUpload,
  showProgress = true 
}: FileUploadProps) {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);

  const simulateUpload = useCallback(async (file: File): Promise<void> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Add file to upload items
    setUploadItems(prev => [...prev, {
      file,
      progress: 0,
      status: 'uploading',
      id: fileId
    }]);

    try {
      // Simulate upload progress - MUCH FASTER (0.5 seconds total)
      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Very fast: 50ms per step
        
        setUploadItems(prev => 
          prev.map(item => 
            item.id === fileId 
              ? { ...item, progress }
              : item
          )
        );
      }

      // Call the actual upload function if provided
      if (onFileUpload) {
        await onFileUpload(file);
      }
      
      // Mark as completed - this should happen AFTER the upload succeeds
      setUploadItems(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'completed', progress: 100 }
            : item
        )
      );
    } catch (error) {
      console.error('Upload failed:', error);
      // Mark as error
      setUploadItems(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'error', progress: 100 }
            : item
        )
      );
    }
  }, [onFileUpload]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Only allow one file at a time
      if (uploadItems.length > 0) {
        return; // Don't allow new files if one is already uploading
      }
      
      const file = acceptedFiles[0];
      onFileSelect(file);
      
      // Start uploading if showProgress is enabled
      if (showProgress) {
        simulateUpload(file);
      }
    }
  }, [onFileSelect, showProgress, simulateUpload, uploadItems.length]);

  const removeFile = useCallback((fileId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove from upload items
    setUploadItems(prev => prev.filter(item => item.id !== fileId));
    
    // Clear the selected file so the "Upload and Process" button becomes disabled
    onFileSelect(null);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: uploadItems.length > 0 // Disable when a file is already uploaded
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        bgcolor: uploadItems.length > 0 ? '#f8fafc' : 
                 isDragActive ? '#dcfce7' : '#eff6ff',
        border: uploadItems.length > 0 ? '2px solid #e2e8f0' :
                '2px dashed #86efac',
        color: '#1a1a1a',
        boxShadow: '0 2px 8px rgba(30,64,175,0.04)',
        borderRadius: 2,
        p: 3,
        cursor: uploadItems.length > 0 ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': uploadItems.length === 0 ? {
          borderColor: '#059669',
          backgroundColor: '#dcfce7',
        } : {},
        minHeight: uploadItems.length > 0 ? 'auto' : '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <input 
        {...getInputProps()} 
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      />
      
      {/* Upload Area */}
      {uploadItems.length === 0 && (
        <Box sx={{ 
          color: 'text.secondary',
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: '#059669' }} />
          {isDragActive ? (
            <Typography variant="body1" sx={{ color: '#059669', fontWeight: 500 }}>
              Drop the Excel file here...
            </Typography>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ color: "#1E1E1E", fontWeight: 500 }}>
                Drag and drop your Excel file here
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: "#757575" }}>
                or click to browse your file
              </Typography>
              <Typography variant="body2" color="#757575">
                (Only .xlsx or .xls files are accepted)
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Upload Items Display inside the drop zone */}
      {uploadItems.length > 0 && (
        <Box>
          <Typography variant="body1" sx={{ mb: 2, color: '#1a1a1a', fontWeight: 500, textAlign: 'center' }}>
            Your File
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {uploadItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                        {item.file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        ({(item.file.size / 1024).toFixed(1)} KB)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.status === 'completed' && (
                        <CheckCircleIcon sx={{ color: '#059669' }} />
                      )}
                      {item.status === 'error' && (
                        <ErrorIcon color="error" />
                      )}
                      <IconButton 
                        size="small" 
                        onClick={(e) => removeFile(item.id, e)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  {showProgress && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.progress} 
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: '#757575' }}>
                        {item.progress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
} 