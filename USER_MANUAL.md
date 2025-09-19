# 🎓 Aurex Exam Generator - Complete User Manual

**Version:** 1.0.0  
**Built with:** Next.js, Python Flask  
**License:** Academic Use

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Quick Start Guide](#quick-start-guide)
5. [User Interface Guide](#user-interface-guide)
6. [Features and Functionality](#features-and-functionality)
7. [File Formats and Templates](#file-formats-and-templates)
8. [API Documentation](#api-documentation)
9. [Project Structure](#project-structure)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)
12. [Support and Contribution](#support-and-contribution)

---

## Overview

**Aurex Exam Generator** is a comprehensive desktop application designed for educators to create, manage, and generate professional exam papers. The system provides intelligent features including grammar checking, duplicate question detection, similarity analysis, and automated document generation.

### Key Features
- 📄 **Excel Question Bank Processing** - Upload and parse structured question banks
- 🔍 **Advanced Grammar Checking** - Integrated LanguageTool grammar validation
- 🔄 **Intelligent Duplicate Detection** - AI-powered similarity analysis
- ✏️ **Question Editor** - Interactive editing with real-time validation
- 📋 **Multiple Question Types** - Support for MCQ, True/False, Matching, and Written questions
- 📑 **Document Generation** - Automated Word document creation for exams and answer keys
- 🖼️ **Image Support** - Upload and embed images in questions
- 🎨 **Template Management** - Custom Word document templates
- 🔒 **Local Processing** - All data processed locally for security

---

## System Requirements

### Prerequisites
- **Operating System:** Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **Python:** Version 3.8 or higher
- **Node.js:** Version 18 or higher (LTS recommended)
- **Memory:** Minimum 4GB RAM (8GB recommended)
- **Storage:** At least 2GB free space
- **Internet:** Required for initial setup and grammar checking service

### Browser Compatibility
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari (macOS only)

---

## Installation

### Windows Installation (Recommended)

#### Method 1: Automated Setup (Recommended)
1. **Download the project** to your desired location
2. **Open Command Prompt** (Run as Administrator recommended)
3. **Navigate to project folder:**
   ```bash
   cd "C:\path\to\SeniorProject1"
   ```
4. **Run the setup script:**
   ```bash
   setup-and-run.bat
   ```

The script will automatically:
- ✅ Check Python and Node.js installation
- ✅ Create Python virtual environment
- ✅ Install all backend dependencies
- ✅ Install frontend dependencies
- ✅ Start both servers
- ✅ Open the application in your browser

#### Method 2: Manual Installation
If the automated script fails, follow these steps:

1. **Install Python 3.8+**
   - Download from [python.org](https://python.org)
   - ⚠️ **Important:** Check "Add Python to PATH" during installation

2. **Install Node.js 18+**
   - Download LTS version from [nodejs.org](https://nodejs.org)
   - This includes npm package manager

3. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate.bat
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   ```

### macOS/Linux Installation

1. **Make setup script executable:**
   ```bash
   chmod +x setup-and-run.sh
   ```

2. **Run setup:**
   ```bash
   ./setup-and-run.sh
   ```

3. **Manual setup if needed:**
   ```bash
   # Backend setup
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend setup
   cd frontend
   npm install
   ```

---

## Quick Start Guide

### First-Time Users

1. **Run Setup:**
   - Windows: Double-click `setup-and-run.bat`
   - macOS/Linux: Run `./setup-and-run.sh`

2. **Wait for Services:**
   - Backend starts on `http://localhost:5001`
   - Frontend opens at `http://localhost:3000`
   - First startup takes 15-20 seconds (LanguageTool initialization)

3. **Access Application:**
   - Browser should open automatically
   - If not, manually navigate to `http://localhost:3000`

### Subsequent Use

For faster startup after initial setup:
```bash
quick-start.bat
```
This skips dependency installation and starts servers directly.

### Basic Workflow

1. **Upload Question Bank** - Excel file with structured questions
2. **Review Questions** - Grammar errors highlighted automatically
3. **Handle Duplicates** - Resolve any detected duplicate questions
4. **Edit Questions** - Make necessary corrections using the editor
5. **Generate Documents** - Create exam papers and answer keys

---

## User Interface Guide

### Landing Page
- **Aurex Branding** - Smart • Secure • Effortless
- **Feature Highlights** - Security, Speed, Ease of use
- **Get Started Button** - Navigate to main application

### Home Page Features

#### File Upload Section
- **Drag & Drop Area** - Upload Excel question bank files
- **Progress Tracking** - Real-time upload progress
- **File Validation** - Automatic format checking

#### Processing Options
- **Enable Duplicate Detection** ✅ - AI-powered similarity analysis
- **Enable Grammar Checking** ✅ - LanguageTool integration
- **Similarity Threshold** - Adjustable duplicate detection sensitivity

#### Word Template Management
- **Default Templates** - Built-in exam paper templates
- **Custom Upload** - Upload your own Word document templates
- **Template Selection** - Choose active template for document generation

### Navigation Pages

#### Category Selection (`/category`)
- **Question Type Distribution** - View questions by category
- **Question Count** - Statistics for each question type
- **Navigation Controls** - Proceed to editing or similarity check

#### Question Editor (`/edit`)
- **Interactive Editing** - Modify questions with real-time grammar checking
- **Grammar Error Highlighting** - Visual indicators for errors
- **Image Upload** - Add images to questions
- **Question Type Management** - Handle MCQ, T/F, Matching, Written questions

#### Similarity Check (`/similarity`)
- **Duplicate Detection Results** - AI analysis of question similarities
- **Similarity Scores** - Numerical similarity ratings
- **Resolution Tools** - Keep, merge, or remove duplicate questions

#### Preview (`/preview`)
- **Document Preview** - View generated exam papers
- **Answer Key Preview** - Review answer key format
- **Download Options** - Direct download links

#### Download (`/download`)
- **Generated Files** - Access completed documents
- **File Management** - Organize and download exam materials

---

## Features and Functionality

### 1. Question Bank Processing

#### Excel File Structure
The system expects Excel files with these sheets:
- **Info Sheet** - Metadata (year, semester, department, etc.)
- **Questions Sheet** - Structured question data

#### Supported Question Types
1. **Multiple Choice Questions (MCQ)**
   - Question text with options A, B, C, D
   - Correct answer marking
   - Points allocation

2. **True/False Questions**
   - Statement-based questions
   - Boolean answer selection
   - Point values

3. **Matching Questions**
   - Column A and Column B items
   - Relationship mapping
   - Scoring system

4. **Written Questions**
   - Essay or short answer format
   - Open-ended responses
   - Custom point allocation

### 2. Grammar Checking

#### LanguageTool Integration
- **Real-time Checking** - Grammar validation during upload
- **Error Highlighting** - Visual indicators for grammar issues
- **Suggestion System** - Automated correction suggestions
- **Multi-language Support** - English grammar focus

#### Error Categories
- Spelling errors
- Grammar mistakes
- Style suggestions
- Punctuation corrections

### 3. Duplicate Detection

#### AI-Powered Analysis
- **Semantic Similarity** - Content-based duplicate detection
- **Configurable Threshold** - Adjustable sensitivity (0.0-1.0)
- **Question Clustering** - Group similar questions
- **Resolution Options** - Keep, merge, or remove duplicates

#### Similarity Algorithms
- Sentence transformer models
- Cosine similarity computation
- Natural language processing
- Context-aware matching

### 4. Document Generation

#### Word Document Creation
- **Exam Papers** - Professional formatted exams
- **Answer Keys** - Corresponding answer sheets
- **Template System** - Customizable document layouts
- **Image Integration** - Embedded question images

#### Template Management
- **Default Templates** - Built-in professional formats
- **Custom Templates** - Upload your own Word templates
- **Template Variables** - Dynamic content insertion
- **Formatting Preservation** - Maintain document styling

### 5. Image Handling

#### Image Upload System
- **Supported Formats** - JPEG, PNG, GIF
- **File Size Limits** - Reasonable size restrictions
- **Storage Management** - Temporary file cleanup
- **Integration** - Seamless embedding in questions

---

## File Formats and Templates

### Excel Question Bank Format

#### Info Sheet Structure
| Field | Description | Example |
|-------|-------------|---------|
| Year | Academic year | 2024 |
| Semester | Study period | Fall |
| Exam Type | Assessment type | Midterm |
| Department | Academic department | Computer Science |
| Course Code | Course identifier | CSX3010 |
| Course Name | Full course name | Senior Project |
| Date | Exam date | 15th December 2024 |
| Time | Duration | 2:00 PM |
| Instructions | Exam instructions | Answer all questions |

#### Questions Sheet Structure
| Column | Description | Required |
|--------|-------------|----------|
| Question Number | Sequential ID | Yes |
| Question Type | MCQ/TF/Matching/Written | Yes |
| Question Text | Main question content | Yes |
| Option A | First choice (MCQ) | For MCQ |
| Option B | Second choice (MCQ) | For MCQ |
| Option C | Third choice (MCQ) | For MCQ |
| Option D | Fourth choice (MCQ) | For MCQ |
| Correct Answer | Answer key | Yes |
| Points | Score allocation | Yes |
| Category | Subject category | Optional |

### Word Template Structure

#### Document Variables
Templates can include these placeholders:
- `{{YEAR}}` - Academic year
- `{{SEMESTER}}` - Study semester
- `{{EXAM_TYPE}}` - Type of examination
- `{{DEPARTMENT}}` - Department name
- `{{COURSE_CODE}}` - Course identifier
- `{{COURSE_NAME}}` - Full course name
- `{{DATE}}` - Formatted exam date
- `{{TIME}}` - Exam time
- `{{INSTRUCTIONS}}` - Special instructions

#### Question Formatting
- Automatic question numbering
- Option letter assignment (A, B, C, D)
- Point value display
- Image placement

---

## API Documentation

### Backend Endpoints

#### Core Upload and Processing

**POST** `/upload`
- **Purpose:** Upload and process Excel question bank
- **Parameters:**
  - `file` (FormData) - Excel file
  - `remove_duplicates` (boolean) - Auto-remove duplicates
  - `similarity_threshold` (float) - Duplicate detection threshold
  - `check_duplicates` (boolean) - Enable duplicate detection
  - `check_grammar` (boolean) - Enable grammar checking
- **Response:** Processed questions data with grammar and duplicate annotations

**POST** `/generate`
- **Purpose:** Generate Word documents (exam + answer key)
- **Parameters:**
  - `questions` (JSON) - Processed questions array
  - `metadata` (JSON) - Exam information
  - `template_id` (string) - Word template identifier
- **Response:** Generated document filenames

#### File Management

**GET** `/download/<filename>`
- **Purpose:** Download generated documents
- **Response:** File download stream

**GET** `/preview/<filename>`
- **Purpose:** HTML preview of documents
- **Response:** HTML content for browser preview

**POST** `/cleanup`
- **Purpose:** Clean up temporary files
- **Response:** Cleanup confirmation

#### Template Management

**POST** `/upload-word-template`
- **Purpose:** Upload custom Word template
- **Parameters:** `template` (FormData) - Word document file
- **Response:** Template ID and confirmation

**GET** `/word-templates`
- **Purpose:** List available Word templates
- **Response:** Array of template objects

**POST** `/word-templates/<template_id>/make-default`
- **Purpose:** Set template as default
- **Response:** Update confirmation

**DELETE** `/word-templates/<template_id>`
- **Purpose:** Remove custom template
- **Response:** Deletion confirmation

#### Image Handling

**POST** `/upload-question-image`
- **Purpose:** Upload image for question
- **Parameters:** 
  - `image` (FormData) - Image file
  - `questionId` (string) - Associated question ID
- **Response:** Image filename and URL

**GET** `/images/<filename>`
- **Purpose:** Serve uploaded images
- **Response:** Image file stream

**DELETE** `/cleanup-images`
- **Purpose:** Remove temporary images
- **Response:** Cleanup confirmation

#### Similarity Analysis

**POST** `/analyze-duplicates`
- **Purpose:** Perform similarity analysis on questions
- **Parameters:** `questions` (JSON) - Questions array
- **Response:** Similarity results and duplicate groups

### Frontend Routes

- `/` - Landing page
- `/home` - Main application interface
- `/category` - Question category selection
- `/edit` - Question editing interface  
- `/similarity` - Duplicate resolution page
- `/preview` - Document preview
- `/download` - File download page

---

## Project Structure

### Root Directory
```
SeniorProject1/
├── 📁 backend/              # Python Flask backend
├── 📁 frontend/             # Next.js React frontend  
├── 📁 output/               # Generated documents
├── 📁 processing/           # Shared processing templates
├── 📁 similarityCheck/     # Similarity analysis workspace
├── 📄 README.md            # Project documentation
├── 📄 USER_MANUAL.md       # This comprehensive manual
├── ⚙️ setup-and-run.bat    # Windows setup script
├── ⚙️ setup-and-run.sh     # macOS/Linux setup script
├── ⚙️ quick-start.bat      # Windows quick start
└── 📋 package.json         # Root package configuration
```

### Backend Structure (`/backend`)
```
backend/
├── 📄 app.py                    # Main Flask application
├── 📄 requirements.txt          # Python dependencies
├── 📄 .env                      # Environment configuration
├── 📄 setup_nlp.py             # NLP model initialization
├── 📁 processing/               # Core processing modules
│   ├── 📄 parser.py            # Excel parsing logic
│   ├── 📄 formatter.py         # Document generation
│   ├── 📄 grammar_checker.py   # Grammar validation
│   ├── 📄 duplicate_detector.py # Similarity analysis
│   ├── 📄 similarity_analyzer.py # Advanced similarity
│   └── 📁 templates/           # Document templates
│       ├── 📁 paper/           # Exam paper templates
│       ├── 📁 answerkey/       # Answer key templates
│       ├── 📁 download/        # Download templates
│       └── 📁 images/          # Uploaded images
├── 📁 output/                  # Generated files
├── 📁 similarityCheck/        # Similarity workspace
│   └── 📁 similarity_temp/     # Temporary analysis files
└── 📁 __pycache__/            # Python cache
```

### Frontend Structure (`/frontend`)
```
frontend/
├── 📄 package.json             # Node.js dependencies
├── 📄 next.config.ts           # Next.js configuration
├── 📄 tsconfig.json           # TypeScript configuration  
├── 📄 .env.local              # Environment variables
├── 📁 src/                    # Source code
│   ├── 📁 app/                # Next.js app router pages
│   │   ├── 📄 page.tsx        # Landing page
│   │   ├── 📄 layout.tsx      # App layout
│   │   ├── 📄 globals.css     # Global styles
│   │   ├── 📁 home/           # Home page
│   │   ├── 📁 category/       # Category selection
│   │   ├── 📁 edit/           # Question editor
│   │   ├── 📁 similarity/     # Similarity checker
│   │   ├── 📁 preview/        # Document preview
│   │   ├── 📁 download/       # Download page
│   │   └── 📁 api/            # API routes
│   ├── 📁 components/         # Reusable React components
│   │   ├── 📄 Navbar.tsx      # Navigation component
│   │   ├── 📄 FileUpload.tsx  # File upload widget
│   │   ├── 📄 ProcessingModal.tsx # Processing overlay
│   │   ├── 📄 CategorySelection.tsx # Category picker
│   │   ├── 📄 ImageUpload.tsx # Image upload component
│   │   └── 📁 QuestionEditor/ # Question editing components
│   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📄 useProcessing.ts # Processing state management
│   │   └── 📄 useWorkflowState.ts # Workflow state
│   ├── 📁 types/              # TypeScript type definitions
│   │   └── 📄 index.ts        # Shared types
│   └── 📁 utils/              # Utility functions
│       └── 📄 api.ts          # API communication
├── 📁 public/                 # Static assets
│   ├── 📄 electron.js         # Electron main process
│   ├── 📄 preload.js          # Electron preload script
│   └── 🖼️ *.svg              # SVG icons
└── 📁 .next/                  # Next.js build output
```

### Processing Modules Details

#### Parser (`processing/parser.py`)
- Excel file parsing and validation
- Question structure extraction
- Metadata processing
- Error handling and reporting

#### Formatter (`processing/formatter.py`)
- Word document generation
- Template variable replacement
- Question formatting and layout
- Answer key creation

#### Grammar Checker (`processing/grammar_checker.py`)
- LanguageTool integration
- Error detection and classification
- Suggestion generation
- Batch processing capabilities

#### Duplicate Detector (`processing/duplicate_detector.py`)
- Similarity computation algorithms
- Question clustering
- Threshold-based duplicate identification
- Resolution recommendation

#### Similarity Analyzer (`processing/similarity_analyzer.py`)
- Advanced semantic analysis
- Session management for large datasets
- Caching and performance optimization
- Cleanup and maintenance

---

## Troubleshooting

### Installation Issues

#### **Problem: "Python is not installed" error**
**Solution:**
1. Download Python 3.8+ from [python.org](https://python.org)
2. ⚠️ **CRITICAL:** Check "Add Python to PATH" during installation
3. Restart Command Prompt/Terminal
4. Verify with: `python --version`

#### **Problem: "Node.js is not installed" error**
**Solution:**
1. Download Node.js LTS from [nodejs.org](https://nodejs.org)
2. Install with default settings
3. Restart Command Prompt/Terminal
4. Verify with: `node --version` and `npm --version`

#### **Problem: "Permission denied" error (macOS/Linux)**
**Solution:**
```bash
chmod +x setup-and-run.sh
./setup-and-run.sh
```

#### **Problem: Python virtual environment creation fails**
**Solution:**
```bash
# Ensure pip is updated
python -m pip install --upgrade pip

# Create virtual environment manually
python -m venv backend/venv

# Activate (Windows)
backend\venv\Scripts\activate.bat

# Activate (macOS/Linux)
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Runtime Issues

#### **Problem: Application window is blank**
**Solutions:**
1. Wait 15-20 seconds for backend initialization
2. Refresh browser with `Ctrl+R` (Windows) or `Cmd+R` (macOS)
3. Check browser console for error messages
4. Verify both servers are running in terminal windows
5. Try incognito/private browsing mode

#### **Problem: "Port already in use" error**
**Solutions:**
1. Close any other instances of the application
2. Kill processes using ports 3000 and 5001:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :5001
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5001 | xargs kill -9
   ```
3. Restart your computer if issue persists

#### **Problem: Grammar checking is slow or fails**
**Solutions:**
1. **First startup:** LanguageTool downloads ~300MB data (one-time)
2. **Subsequent use:** Should be much faster
3. **Connection issues:** Ensure internet connectivity
4. **Firewall:** Allow Python applications through firewall
5. **Antivirus:** Whitelist the project directory

#### **Problem: File upload fails**
**Solutions:**
1. **File format:** Ensure Excel file (.xlsx) format
2. **File size:** Check file is under reasonable size limit
3. **Permissions:** Ensure read permissions on file
4. **Antivirus:** Temporarily disable real-time scanning
5. **Disk space:** Ensure sufficient free space in project directory

#### **Problem: Generated documents are corrupted**
**Solutions:**
1. **Template issues:** Try using default template
2. **Permissions:** Ensure write permissions in output directory
3. **Antivirus:** Whitelist output directory
4. **Dependencies:** Reinstall Python packages:
   ```bash
   pip install --force-reinstall python-docx docxtpl
   ```

### Performance Issues

#### **Problem: Slow duplicate detection**
**Solutions:**
1. **Large datasets:** Reduce similarity threshold (0.6-0.7)
2. **Memory usage:** Close other applications
3. **Hardware:** Use machine with more RAM if available
4. **Optimization:** Process smaller batches of questions

#### **Problem: High memory usage**
**Solutions:**
1. **Cleanup:** Regularly use cleanup functions in app
2. **Restart:** Restart application periodically for large workflows
3. **Monitoring:** Use Task Manager/Activity Monitor to track usage

### Network Issues

#### **Problem: Cannot access localhost:3000**
**Solutions:**
1. **Wait longer:** Frontend takes time to compile and start
2. **Port conflict:** Try alternative port:
   ```bash
   cd frontend
   npm run dev -- --port 3001
   ```
3. **Firewall:** Configure firewall to allow local connections
4. **Browser cache:** Clear browser cache and cookies

#### **Problem: Backend API calls fail**
**Solutions:**
1. **Backend status:** Verify backend is running on port 5001
2. **CORS issues:** Check browser console for CORS errors
3. **Environment:** Verify `.env.local` has correct backend URL
4. **Network:** Disable VPN or proxy if active

### Data Issues

#### **Problem: Excel file parsing fails**
**Solutions:**
1. **Format validation:** Use provided Excel templates
2. **Sheet names:** Ensure "Info" and "Questions" sheets exist
3. **Data integrity:** Check for empty cells in required columns
4. **Encoding:** Save Excel file with UTF-8 encoding
5. **Version:** Use Excel 2016+ or LibreOffice Calc

#### **Problem: Generated documents missing content**
**Solutions:**
1. **Template variables:** Verify template contains required placeholders
2. **Question data:** Check question parsing completed successfully
3. **Image paths:** Ensure image files are accessible
4. **Metadata:** Verify Info sheet contains all required fields

---

## FAQ

### General Questions

**Q: Is my data secure?**
A: Yes! All processing happens locally on your computer. No data is sent to external servers except for grammar checking via LanguageTool, which only processes text snippets for validation.

**Q: Can I use this offline?**
A: Partially. The application works offline except for grammar checking, which requires internet connectivity for LanguageTool service.

**Q: What file formats are supported?**
A: **Input:** Excel (.xlsx), Word templates (.docx), Images (JPEG, PNG, GIF)
**Output:** Word documents (.docx), HTML previews

**Q: How many questions can I process at once?**
A: The system can handle hundreds of questions, but performance depends on your hardware. For best results, process 50-200 questions at a time.

**Q: Can I customize the exam paper format?**
A: Yes! Upload your own Word document templates with custom formatting, headers, footers, and styling.

### Technical Questions

**Q: Why is the first upload slow?**
A: LanguageTool downloads language models (~300MB) on first use. Subsequent uses are much faster as models are cached locally.

**Q: Can I run this on a server?**
A: While technically possible, the application is designed for desktop use. Server deployment would require additional configuration and security considerations.

**Q: How accurate is the duplicate detection?**
A: The AI-powered similarity detection is highly accurate, using semantic analysis rather than simple text matching. You can adjust the sensitivity threshold (0.6-0.9 recommended).

**Q: Can I batch process multiple Excel files?**
A: Currently, the system processes one Excel file at a time. You can combine multiple question banks into a single Excel file for processing.

### Usage Questions

**Q: How do I create the Excel question bank?**
A: Use the provided Excel templates or follow the structure documented in this manual. Include "Info" and "Questions" sheets with proper column headers.

**Q: Can I add images to questions?**
A: Yes! Use the image upload feature in the question editor to add visual elements to any question type.

**Q: How do I handle grammar suggestions?**
A: Grammar errors are highlighted in red during processing. Use the question editor to review and apply suggestions manually.

**Q: What's the difference between question types?**
A: **MCQ** (4 options), **True/False** (2 options), **Matching** (column pairs), **Written** (open-ended). Each has specific formatting requirements.

### Troubleshooting Questions

**Q: The application won't start. What do I do?**
A: 1) Verify Python and Node.js are installed, 2) Run as Administrator on Windows, 3) Check antivirus isn't blocking, 4) Try manual installation steps.

**Q: Generated Word documents won't open.**
A: This usually indicates a template or formatting issue. Try using the default template first, then check your custom template for errors.

**Q: Duplicate detection found too many/few duplicates.**
A: Adjust the similarity threshold: Higher (0.8-0.9) for stricter matching, lower (0.6-0.7) for more sensitive detection.

**Q: Images aren't showing in generated documents.**
A: Ensure images are uploaded through the application and paths are correctly referenced. Check that image files haven't been moved or deleted.

---

## Support and Contribution

### Getting Help

#### Documentation
- **README.md** - Quick start guide and basic setup
- **USER_MANUAL.md** - This comprehensive manual
- **Code Comments** - Inline documentation in source code

#### Error Reporting
When reporting issues, please include:
1. **Operating System** and version
2. **Python version** (`python --version`)
3. **Node.js version** (`node --version`)
4. **Error messages** from terminal/console
5. **Steps to reproduce** the issue
6. **Sample files** if relevant (anonymized)

#### Log Files
Check these locations for detailed error information:
- **Backend logs:** Terminal running `python app.py`
- **Frontend logs:** Terminal running `npm run dev`
- **Browser console:** F12 Developer Tools
- **System logs:** Windows Event Viewer / macOS Console

### Development

#### Project Architecture
- **Backend:** Python Flask with modular processing components
- **Frontend:** Next.js React with TypeScript
- **Communication:** REST API with JSON data exchange
- **File Processing:** pandas, python-docx, NLTK libraries
- **AI/ML:** sentence-transformers for semantic similarity

#### Code Organization
- **Separation of Concerns:** Clear division between parsing, processing, and generation
- **Modular Design:** Independent modules for grammar, duplicates, formatting
- **Error Handling:** Comprehensive error catching and user feedback
- **Performance:** Efficient algorithms and caching strategies

#### Development Setup
```bash
# Backend development
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py

# Frontend development  
cd frontend
npm install
npm run dev
```

#### Testing
- **Backend:** Unit tests for processing modules
- **Frontend:** Component testing with React Testing Library
- **Integration:** End-to-end workflow testing
- **File Formats:** Validation with various Excel structures

### Contributing

#### Areas for Enhancement
1. **Additional Question Types** - Essay questions, diagram labeling
2. **Advanced Templates** - More sophisticated Word document layouts
3. **Export Formats** - PDF generation, online exam formats
4. **Analytics** - Question difficulty analysis, performance metrics
5. **Collaboration** - Multi-user editing, version control
6. **Accessibility** - Screen reader support, keyboard navigation

#### Code Standards
- **Python:** PEP 8 style guidelines
- **JavaScript/TypeScript:** ESLint configuration provided
- **Documentation:** Comprehensive docstrings and comments
- **Error Handling:** User-friendly error messages and logging

#### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request with detailed description

---

## Version History and Changelog

### Version 1.0.0 (Current)
- **Initial Release** - Complete exam generation system
- **Core Features** - Excel parsing, grammar checking, duplicate detection
- **Document Generation** - Word paper and answer key creation
- **Template System** - Custom Word document templates
- **Image Support** - Question image upload and embedding
- **Web Interface** - Responsive Next.js frontend
- **Local Processing** - Privacy-focused local data handling

### Planned Enhancements
- **PDF Export** - Direct PDF generation without Word dependency
- **Question Analytics** - Difficulty assessment and statistics
- **Batch Processing** - Multiple file handling improvements
- **Mobile Responsiveness** - Enhanced mobile device support
- **Performance Optimization** - Faster processing for large question banks

---

## License and Legal

### Academic Use License
This software is provided for educational and academic purposes. Commercial use requires separate licensing agreement.

### Third-Party Dependencies
- **LanguageTool** - Grammar checking service
- **Flask** - Web framework (BSD License)
- **React/Next.js** - Frontend framework (MIT License)  
- **Material-UI** - Component library (MIT License)
- **pandas** - Data processing (BSD License)
- **python-docx** - Document generation (MIT License)

### Data Privacy
- All question data processed locally
- Grammar checking sends only text snippets to LanguageTool
- No personal data transmitted to external servers
- Temporary files automatically cleaned up

### Security Notice
- Run only on trusted networks
- Scan uploaded files for malware
- Keep dependencies updated for security patches
- Use antivirus software for additional protection

---

## Contact Information

### Development Team
- **Project Name:** Senior Project 1 (CSX3010-SP1)
- **Institution:** AU (Academic University)
- **Academic Year:** 3rd Year, 2nd Semester

### Technical Support
For technical assistance with Aurex Exam Generator:
1. Check this user manual thoroughly
2. Review troubleshooting section
3. Contact development team with detailed error information
4. Include system specifications and steps to reproduce issues

---

**Thank you for using Aurex Exam Generator!**

*This manual is comprehensive and covers all aspects of the system. For the most up-to-date information, always refer to the latest version of this documentation.*

---

*Document Version: 1.0.0 | Last Updated: September 2025 | Total Pages: Comprehensive User Guide*