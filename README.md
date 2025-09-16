# 🎓 Exam Generator - Desktop Application

A desktop application for generating exam papers and answer keys with grammar checking and duplicate detection features.

## 📋 Quick Start for Professors

### Prerequisites
Before running the application, please install:

1. **Python 3.8 or higher** 
   - Download from: https://python.org
   - During installation, make sure to check "Add Python to PATH"

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org
   - Choose the "LTS" (Long Term Support) version

### 🚀 One-Click Setup & Run

#### For Mac/Linux:
1. Open Terminal
2. Navigate to the project folder: `cd /path/to/SeniorProject1`
3. Run: `chmod +x setup-and-run.sh && ./setup-and-run.sh`

#### For Windows:
1. Open Command Prompt
2. Navigate to the project folder: `cd C:\path\to\SeniorProject1`
3. Double-click `setup-and-run.bat` or run: `setup-and-run.bat`

The script will:
- ✅ Check if Python and Node.js are installed
- ✅ Install all dependencies automatically
- ✅ Build the application
- ✅ Start the desktop application

### 🔧 Manual Setup (Alternative)

If the automatic script doesn't work, you can run these commands manually:

```bash
# bash
# 1. Install Python dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
# On Windows: source venv\\Scripts\\activate
pip install -r requirements.txt

# 2. Install Node.js dependencies and build
cd ../frontend
npm install
npm run build

# 3. Start the application
npm run electron
```

## 📱 Using the Application

Once the application starts, you'll see a desktop window with the Exam Generator interface.

### Features:
- 📄 **Upload Excel files** with question banks
- 🔍 **Grammar checking** with error highlighting
- 🔄 **Duplicate detection** and management
- ✏️ **Question editing** and customization
- 📋 **Multiple question types**: Multiple choice, True/False, Matching, Written
- 📑 **Generate Word documents** for exams and answer keys
- 🖼️ **Image support** for questions

### Basic Workflow:
1. **Upload** your Excel question bank file
2. **Review and edit** questions (grammar errors will be highlighted)
3. **Handle duplicates** if any are detected
4. **Preview** your exam structure
5. **Generate** final Word documents

## 📁 File Structure

```
SeniorProject1/
├── frontend/           # Next.js frontend application
├── backend/           # Python Flask backend
├── setup-and-run.sh  # Mac/Linux setup script
├── setup-and-run.bat # Windows setup script
└── README.md         # This file
```

## 🛠️ For Developers

### Development Mode
```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start Electron (optional)
cd frontend
npm run electron-dev
```

### Building for Distribution
```bash
cd frontend
npm run dist
```

This creates installers in `frontend/dist-electron/`:
- `.dmg` file for Mac
- `.exe` installer for Windows
- `.AppImage` for Linux

## 🐛 Troubleshooting

### Common Issues:

**1. "Python is not installed" error**
- Install Python from https://python.org
- Make sure to check "Add Python to PATH" during installation
- Restart Command Prompt/Terminal after installation

**2. "Node.js is not installed" error**
- Install Node.js from https://nodejs.org
- Choose the LTS version
- Restart Command Prompt/Terminal after installation

**3. "Permission denied" error (Mac/Linux)**
- Run: `chmod +x setup-and-run.sh`
- Then: `./setup-and-run.sh`

**4. Application window is blank**
- Wait a few seconds for the backend to start
- Try refreshing with Ctrl+R (Cmd+R on Mac)
- Check if antivirus is blocking the application

**5. "Port already in use" error**
- Close any other instances of the application
- Restart your computer if the issue persists

### Getting Help:
- Check the console/terminal output for error messages
- Make sure all prerequisites are installed
- Try running the manual setup steps one by one

## 🔒 Security Note

This application runs locally on your computer and does not send data to external servers. All processing happens on your machine.

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at the terminal/command prompt output for error messages
3. Contact the development team with specific error messages

---

**Version:** 1.0.0  
**Built with:** Electron, Next.js, Python Flask  
**License:** Academic Use
