import { SxProps, Theme } from '@mui/material/styles';

// Standard button dimensions
const BUTTON_HEIGHT = '50px';
const BUTTON_PADDING = '16px 32px';
const BUTTON_BORDER_RADIUS = '10px';
const BUTTON_FONT_SIZE = '1rem';
const BUTTON_FONT_WEIGHT = 600;

// Primary Action Buttons (Main CTA buttons)
export const primaryButtonStyles: SxProps<Theme> = {
  height: BUTTON_HEIGHT,
  px: 4,
  py: 1.5,
  borderRadius: BUTTON_BORDER_RADIUS,
  backgroundColor: '#1e3a8a',
  color: 'white',
  fontSize: BUTTON_FONT_SIZE,
  fontWeight: BUTTON_FONT_WEIGHT,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
  border: 'none',
  '&:hover': {
    backgroundColor: '#1e40af',
    boxShadow: '0 6px 16px rgba(30, 58, 138, 0.4)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)',
  },
  '&:disabled': {
    backgroundColor: '#94a3b8',
    color: '#64748b',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  transition: 'all 0.2s ease-in-out',
};

// Secondary Action Buttons (Back, Cancel, etc.)
export const secondaryButtonStyles: SxProps<Theme> = {
  height: BUTTON_HEIGHT,
  px: 4,
  py: 1.5,
  borderRadius: BUTTON_BORDER_RADIUS,
  borderColor: '#1e3a8a',
  color: '#1e3a8a',
  fontSize: BUTTON_FONT_SIZE,
  fontWeight: BUTTON_FONT_WEIGHT,
  textTransform: 'none',
  backgroundColor: 'transparent',
  border: '2px solid #1e3a8a',
  '&:hover': {
    backgroundColor: '#f0f9ff',
    borderColor: '#1e40af',
    color: '#1e40af',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
    backgroundColor: '#e0f2fe',
  },
  '&:disabled': {
    borderColor: '#94a3b8',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },
  transition: 'all 0.2s ease-in-out',
};

// Utility function to get button styles by type
export const getButtonStyles = (variant: 'primary' | 'secondary'): SxProps<Theme> => {
  return variant === 'primary' ? primaryButtonStyles : secondaryButtonStyles;
};

// Button text mappings for consistency
export const BUTTON_TEXTS = {
  // Primary action buttons
  GET_STARTED: "Let's Get Started",
  START_SIMILARITY: "Start Similarity Check",
  ANALYZE_SIMILARITY: "Analyze Similarity",
  NEW_ANALYSIS: "New Analysis",
  APPLY_FILTER: "Apply Filter",
  CONTINUE_PREVIEW: "Continue to Preview",
  GENERATE_PAPER: "Generate Paper",
  DOWNLOAD_EXAM: "Download Exam Paper",
  DOWNLOAD_ANSWER: "Download Answer Key",
  
  // Secondary action buttons
  BACK_HOME: "Back to Home",
  UPLOAD_AGAIN: "Upload Excel Again",
} as const;