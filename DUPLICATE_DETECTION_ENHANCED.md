# Enhanced Duplicate Detection UI

## Overview
The duplicate detection system has been significantly improved with a more intuitive and user-friendly interface. The new implementation provides multiple ways to identify, review, and manage duplicate questions.

## New Features

### 🔎 Inline Highlighting
- **Enhanced Visual Indicators**: Questions with duplicates now have:
  - Color-coded backgrounds (green for representative, red/orange/yellow for duplicates based on similarity)
  - Distinctive borders with hover effects
  - Warning/duplicate icons with badges showing group numbers
  - Improved chips showing similarity percentages

### 📑 Side Panel for Duplicate Management
- **Floating Action Button**: A prominent orange FAB appears when duplicates are detected
  - Shows the number of duplicate groups
  - Click to open the duplicate management panel
- **Comprehensive Duplicate Panel**: Right-side drawer that displays:
  - All duplicate groups sorted by similarity
  - Visual similarity indicators (Very High, High, Medium, Low)
  - Question previews with representative indicators
  - Quick navigation to questions by clicking on them

### 🛠 Actions for Duplicates
Three main actions available for each duplicate group:

1. **Merge**: Keep one question, remove all others
   - Interactive dialog to select which question to keep
   - Automatic cleanup of duplicate flags

2. **Replace**: Use one question's content to overwrite another
   - Two-step process: select source and target
   - Preserves question positioning

3. **Ignore**: Mark duplicates as intentional
   - Removes all duplicate flags from the group
   - Questions remain in the exam

### 💫 Enhanced User Experience
- **Smart Tooltips**: Hover over duplicate indicators to see which questions are similar
- **Smooth Scrolling**: Click on questions in the panel to automatically scroll to them
- **Visual Feedback**: Improved color schemes and animations
- **Responsive Design**: Works well on different screen sizes

## Usage

### Identifying Duplicates
1. **Visual Cues**: Look for color-coded question borders and warning icons
2. **Summary Banner**: Enhanced banner at the top shows duplicate count and legend
3. **Floating Button**: Orange FAB in bottom-right corner

### Managing Duplicates
1. **Open Panel**: Click the floating action button or duplicate icons
2. **Review Groups**: Each group shows similarity level and question previews
3. **Take Action**: Choose to merge, replace, or ignore each group
4. **Navigate**: Click on question previews to jump to them in the main list

### Best Practices
- **Review Representatives**: Green-bordered questions are automatically selected as representatives
- **Check Similarity**: Higher similarity scores (90%+) need more attention
- **Use Tooltips**: Hover over indicators for quick information
- **Test Actions**: Use the preview functionality before finalizing changes

## Technical Implementation

### Components
- `DuplicatePanel.tsx`: Main side panel component
- `RegularQuestion.tsx`: Enhanced with duplicate indicators
- `QuestionEditor/index.tsx`: Integrated floating button and panel

### Key Features
- State management for panel visibility
- Ref-based scrolling for navigation
- Dynamic color calculation based on similarity
- Responsive dialog system for actions

## Color Coding
- **🟢 Green**: Representative questions (will be kept by default)
- **🔴 Red**: High similarity duplicates (90%+ similar)
- **🟠 Orange**: Medium-high similarity (80-89%)
- **🟡 Yellow**: Medium similarity (70-79%)

This enhanced system provides a much more intuitive and powerful way to handle duplicate questions, making it easier for users to maintain clean, high-quality question banks.
