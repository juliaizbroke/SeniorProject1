# 📝 Project Overview

## What is this?
**Exam Generator** is an **offline web application** that helps professors and educators create professional exam papers from Excel question banks.

## Architecture
- **Frontend**: Next.js web interface (port 3000)
- **Backend**: Python Flask API server (port 5001)  
- **Processing**: Local NLP and grammar checking
- **Storage**: File-based, no database required

## How it works
1. User uploads Excel file with questions through web interface
2. Python backend processes and validates questions
3. Grammar checking happens locally using LanguageTool
4. User edits questions through web interface
5. System generates professional Word documents

## Key Benefits
✅ **Offline-First** - Works without internet after setup  
✅ **Privacy-Focused** - Data never leaves your computer  
✅ **Fast Processing** - Local AI/NLP processing  
✅ **Professional Output** - Clean Word document generation  
✅ **Easy Setup** - One-click installation scripts  

## Technical Stack
- **Frontend**: Next.js 15, TypeScript, Material-UI
- **Backend**: Python Flask, language-tool-python, docx
- **Processing**: NLTK, sentence-transformers for duplicate detection
- **Document Generation**: python-docx for Word files

## Deployment Model
This is a **local web application**:
- Runs on user's machine (localhost)
- Web interface accessible at http://localhost:3000
- Backend API at http://localhost:5001
- No server deployment needed
- No internet dependency after setup

---
*Perfect for educational institutions that value privacy and want full control over their exam generation process.*