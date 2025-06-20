# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import threading
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from processing.parser import parse_excel
from processing.formatter import generate_word_files

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = "output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# File cleanup configuration
FILE_EXPIRY_MINUTES = int(os.environ.get('FILE_EXPIRY_MINUTES', 30))  # Default 30 minutes
file_registry = {}  # Track files and their creation times

def startup_cleanup():
    """Clean up any existing files on server startup"""
    try:
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.endswith('.docx'):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                os.remove(file_path)
                print(f"Startup cleanup: Removed {filename}")
    except Exception as e:
        print(f"Error during startup cleanup: {e}")

# Perform startup cleanup
startup_cleanup()

def cleanup_file_after_delay(file_path, delay_minutes=30):
    """Delete file after specified delay in minutes"""
    def delete_file():
        time.sleep(delay_minutes * 60)  # Convert minutes to seconds
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleaned up file: {file_path}")
                # Remove from registry
                if file_path in file_registry:
                    del file_registry[file_path]
        except Exception as e:
            print(f"Error cleaning up file {file_path}: {e}")
    
    # Start cleanup in background thread
    cleanup_thread = threading.Thread(target=delete_file, daemon=True)
    cleanup_thread.start()

def cleanup_expired_files():
    """Clean up files that have exceeded the expiry time"""
    current_time = time.time()
    expired_files = []
    
    for file_path, creation_time in file_registry.items():
        if current_time - creation_time > (FILE_EXPIRY_MINUTES * 60):
            expired_files.append(file_path)
    
    for file_path in expired_files:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleaned up expired file: {file_path}")
            del file_registry[file_path]
        except Exception as e:
            print(f"Error cleaning up expired file {file_path}: {e}")

def register_file_for_cleanup(file_path):
    """Register a file for cleanup tracking"""
    file_registry[file_path] = time.time()
    cleanup_file_after_delay(file_path, FILE_EXPIRY_MINUTES)

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running", "message": "Backend is healthy"})

@app.route("/upload", methods=["POST"])
def upload():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({"error": "Invalid file format. Please upload an Excel file (.xlsx or .xls)"}), 400
        
        questions, metadata = parse_excel(file)
        session_id = str(uuid.uuid4())
        return jsonify({
            "session_id": session_id,
            "questions": questions,
            "metadata": metadata
        })
    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        questions = data['questions']
        metadata = data['metadata']
        session_id = data['session_id']

        exam_path, key_path = generate_word_files(questions, metadata, session_id)
        
        # Register files for automatic cleanup
        register_file_for_cleanup(exam_path)
        register_file_for_cleanup(key_path)
        
        # Also run cleanup for any expired files
        cleanup_expired_files()

        return jsonify({
            "exam_url": f"/download/{os.path.basename(exam_path)}",
            "key_url": f"/download/{os.path.basename(key_path)}",
            "expires_in_minutes": FILE_EXPIRY_MINUTES
        })
    except Exception as e:
        print(f"Error generating exam: {str(e)}")
        return jsonify({"error": f"Failed to generate exam: {str(e)}"}), 500

@app.route("/download/<filename>")
def download(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found or has been cleaned up"}), 404
    return send_file(file_path, as_attachment=True)

@app.route("/cleanup", methods=["POST"])
def manual_cleanup():
    """Manually trigger cleanup of all expired files"""
    try:
        cleanup_expired_files()
        return jsonify({"message": "Cleanup completed successfully"})
    except Exception as e:
        return jsonify({"error": f"Cleanup failed: {str(e)}"}), 500

@app.route("/cleanup/<session_id>", methods=["DELETE"])
def cleanup_session_files(session_id):
    """Manually delete files for a specific session immediately"""
    try:
        exam_file = f"exam_{session_id}.docx"
        key_file = f"answerkey_{session_id}.docx"
        
        deleted_files = []
        for filename in [exam_file, key_file]:
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(filename)
                # Remove from registry
                if file_path in file_registry:
                    del file_registry[file_path]
        
        return jsonify({
            "message": f"Deleted {len(deleted_files)} files",
            "deleted_files": deleted_files
        })
    except Exception as e:
        return jsonify({"error": f"Failed to delete files: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
