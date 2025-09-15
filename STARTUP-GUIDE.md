# 🚀 Startup Methods - Quick Reference

## Two Simple Ways to Start the Exam Generator

### 1️⃣ **First Time Setup**
**File**: `setup-and-run.bat`
**Use when**: 
- First time running the application
- After updating dependencies
- When things aren't working properly

**What it does**:
- Installs all Python and Node.js dependencies
- Sets up virtual environments
- Starts both servers (Frontend: 3000, Backend: 5001)
- Opens browser automatically

---

### 2️⃣ **Quick Start** 
**File**: `quick-start.bat`  
**Use when**:
- Daily development/testing
- Dependencies are already installed
- Just want to start the servers quickly

**What it does**:
- Starts servers immediately (no dependency check)
- Optimized LanguageTool loading (faster processing)
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

---

## ✅ Current Configuration
- **Frontend Port**: 3000
- **Backend Port**: 5001
- **LanguageTool**: Optimized with caching
- **CORS**: Properly configured

## 🔧 Troubleshooting
If you see connection errors:
1. Make sure both command windows stay open
2. Wait 15-20 seconds for full startup
3. Check that no other applications are using ports 3000/5001
4. Use `setup-and-run.bat` if `quick-start.bat` fails

---
*Last updated: Optimized for speed and simplicity*