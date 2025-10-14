'use client';

import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { usePathname } from 'next/navigation';

interface HelpContent {
  title: string;
  sections: {
    subtitle: string;
    content: string[];
  }[];
}

const helpContentMap: Record<string, HelpContent> = {
  '/': {
    title: 'Welcome to AUREX',
    sections: [
      {
        subtitle: 'Exam Generation',
        content: [
          'Click "Let\'s Get Started!" to begin creating your exam paper.',
        ],
      },
      {
        subtitle: 'Exam Paper Similarity Checking',
        content: [
          'Click "Check Similarity" to begin checking similarities across one or more exam papers.',
        ],
      },
    ],
  },

  '/home': {
    title: 'Upload Excel/Word File',
    sections: [
      {
        subtitle: 'Question Bank Excel File Format',
        content: [
          'Supported types: Multiple Choice, True/False, Matching, and Written Questions .',
          'Download and use the official Excel template to maintain proper structure and column names.',
          'Fill data in desired fields accordingly to ensure successful parsing.',
        ],
      },
      {
        subtitle: 'Question Paper Word File Format',
        content: [
          'Download and use the official Word template to maintain proper structure and formatting.',
          'Edit the desired content as needed. Be careful! Do not remove any Jinja code.',
          'Upload the Word file. Now the uploaded template can be used by making it the default template.',
        ],
      },
      {
        subtitle: 'Quality Assurance Options',
        content: [
          'You can enable or disable Grammar Check and Duplicate Detection before generation.',
          'When enabled, the system automatically flags grammar issues and detects similar or duplicated questions.',
          'Uncheck these options to skip QA for faster processing.',
        ],
      },
    ],
  },

  '/category': {
    title: 'Category Selection',
    sections: [
      {
        subtitle: 'Editing Exam Information',
        content: [
          'After uploading, edit desired information to include in the exam paper.',
        ],
      },
      {
        subtitle: 'Selecting Categories',
        content: [
          'Choose which question categories to include in your exam.',
          'Specify how many questions to retrieve from each category.',
          'AUREX will randomly select questions based on your preferences while maintaining balance across chapters.',
        ],
      },
      {
        subtitle: 'Tips',
        content: [
          'Selections can be revised later during the editing phase.',
        ],
      },
    ],
  },

  '/edit': {
    title: 'Question Editor',
    sections: [
      {
        subtitle: 'Editing Questions',
        content: [
          'View and modify each question directly in the editor.',
          'Use the shuffle button to replace questions from the same category.',
          'Pin questions (blue pin icon) to keep them fixed while shuffling others.',
          'All edits automatically apply to the final paper preview.',
        ],
      },
      {
        subtitle: 'Duplicate Detection',
        content: [
          'Similar or duplicated questions are automatically grouped together.',
          'Click "Choose One" to keep a single representative question. The unselected question will be replaced with a random question from the pool.',
          'You may also click "Ignore" to retain all items in a duplicate group.',
        ],
      },
      {
        subtitle: 'Grammar Checking',
        content: [
          'Questions with detected grammar or spelling issues are highlighted in orange.',
          'Review and correct flagged issues directly in the editor.',
        ],
      },
      {
        subtitle: 'Pin and Shuffle',
        content: [
          'Pinned questions remain fixed during shuffling.',
          'Click the shuffle button to replace non-pinned questions within the same category.',
          'Use pins strategically to preserve preferred or manually edited questions.',
        ],
      },
    ],
  },

  '/similarity': {
    title: 'Exam Paper Similarity Check',
    sections: [
      {
        subtitle: 'Checking for Duplicates Across Exams',
        content: [
          'Upload desired exam papers (Word files) to compare across each other.',
          'AUREX will analyze question similarity using a two-tier NLP pipeline (TF-IDF + semantic matching).',
          'The system highlights overlapping questions with similarity percentages for review.',
          'The cells are also interactive - click on a cell to view details.',
        ],
      },
      {
        subtitle: 'Understanding Results',
        content: [
          'High Risk (≥ 75%): likely identical or heavily similar questions.',
          'Medium Risk (50–75%): partially reworded or conceptually similar questions.',
          'Low Risk (< 50%): mostly unique content.',
          'Use these insights to adjust, edit, or replace similar questions before finalizing your exam.',
        ],
      },
    ],
  },

  '/preview': {
    title: 'Preview & Export',
    sections: [
      {
        subtitle: 'Preview Your Exam Paper',
        content: [
          'Review the final layout and formatting of your exam paper before download.',
          'Ensure numbering, spacing, and question alignment match your expectations.',
          'Preview includes both question and answer sections for verification.',
        ],
      },
      {
        subtitle: 'Export Options',
        content: [
          'Download your finalized exam as a Microsoft Word (.docx) document for printing or archiving.',
          'Answer keys are generated automatically and saved in a separate file.',
          'AUREX ensures that exported files follow your chosen Word template and formatting rules.',
        ],
      },
    ],
  },
};

const HelpButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const helpContent = helpContentMap[pathname] || helpContentMap['/'];

  return (
    <>
      {/* Floating Help Button */}
      <Fab
        color="primary"
        aria-label="help"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          top: 72, // Below navbar (56px navbar + 16px spacing)
          right: 24,
          zIndex: 1000,
          width: 48,
          height: 48,
          backgroundColor: '#1e3a8a',
          '&:hover': {
            backgroundColor: '#1e40af',
          },
        }}
      >
        <InfoIcon sx={{ fontSize: 28, fontWeight: 'bold' }} />
      </Fab>

      {/* Help Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
            p: 4,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: -16,
              top: -16,
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 700, color: '#1e3a8a' }}>
            {helpContent.title}
          </Typography>

          <Box sx={{ overflow: 'auto' }}>
            {helpContent.sections.map((section, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: '#1e3a8a',
                    mb: 1,
                    fontSize: '1rem',
                  }}
                >
                  {section.subtitle}:
                </Typography>
                {section.content.map((text, textIdx) => (
                  <Typography
                    key={textIdx}
                    variant="body1"
                    sx={{
                      mb: 2,
                      lineHeight: 1.6,
                    }}
                  >
                    {text}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <button
              onClick={handleClose}
              style={{
                backgroundColor: '#1e3a8a',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Close
            </button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default HelpButton;
