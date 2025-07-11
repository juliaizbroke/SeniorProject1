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

try:
    import mammoth
    HTML_CONVERSION_AVAILABLE = True
except ImportError:
    HTML_CONVERSION_AVAILABLE = False
    print("Warning: mammoth not available. HTML preview will be disabled.")

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

def convert_docx_to_html(docx_path):
    """Convert DOCX file to HTML for preview"""
    print(f"HTML_CONVERSION_AVAILABLE: {HTML_CONVERSION_AVAILABLE}")
    print(f"Attempting to convert: {docx_path}")
    
    if not HTML_CONVERSION_AVAILABLE:
        print("HTML conversion not available - mammoth not imported")
        return None
    
    if not os.path.exists(docx_path):
        print(f"DOCX file does not exist: {docx_path}")
        return None
    
    try:
        html_path = docx_path.replace('.docx', '_preview.html')
        print(f"HTML output path: {html_path}")
        
        with open(docx_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            
            # Check for conversion warnings
            if hasattr(result, 'messages') and result.messages:
                print(f"Conversion warnings: {result.messages}")
            
            # Get the HTML content - the correct attribute is 'value'
            html_content_raw = result.value
            print(f"HTML content length: {len(html_content_raw)} characters")
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Document Preview</title>
    <style>
        body {{ 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: white;
        }}
        h1, h2, h3 {{ color: #333; }}
        p {{ margin-bottom: 1em; }}
        table {{ border-collapse: collapse; width: 100%; margin: 1em 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f5f5f5; }}
        .question {{ margin: 1em 0; }}
        .answer {{ font-weight: bold; }}
    </style>
</head>
<body>
    {html_content_raw}
</body>
</html>"""
        
        with open(html_path, 'w', encoding='utf-8') as html_file:
            html_file.write(html_content)
        
        print(f"HTML file created successfully: {html_path}")
        print(f"HTML file size: {os.path.getsize(html_path)} bytes")
        register_file_for_cleanup(html_path)  # Also cleanup HTML files
        return html_path
    except Exception as e:
        print(f"Error converting DOCX to HTML: {e}")
        import traceback
        traceback.print_exc()
        return None

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
        
        # Register Word files for automatic cleanup
        register_file_for_cleanup(exam_path)
        register_file_for_cleanup(key_path)
        
        # Create HTML versions for preview
        print(f"Creating HTML previews for exam: {exam_path}, key: {key_path}")
        exam_html_path = convert_docx_to_html(exam_path)
        key_html_path = convert_docx_to_html(key_path)
        
        print(f"HTML conversion results - exam: {exam_html_path}, key: {key_html_path}")
        
        # Also run cleanup for any expired files
        cleanup_expired_files()

        response_data = {
            "exam_url": f"/download/{os.path.basename(exam_path)}",
            "key_url": f"/download/{os.path.basename(key_path)}",
            "expires_in_minutes": FILE_EXPIRY_MINUTES
        }
        
        # Add preview URLs if HTML conversion was successful
        if exam_html_path:
            response_data["exam_preview_url"] = f"/preview/{os.path.basename(exam_html_path)}"
            print(f"Added exam preview URL: {response_data['exam_preview_url']}")
        if key_html_path:
            response_data["key_preview_url"] = f"/preview/{os.path.basename(key_html_path)}"
            print(f"Added key preview URL: {response_data['key_preview_url']}")
            
        print(f"Final response data: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        print(f"Error generating exam: {str(e)}")
        return jsonify({"error": f"Failed to generate exam: {str(e)}"}), 500

@app.route("/download/<filename>")
def download(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found or has been cleaned up"}), 404
    return send_file(file_path, as_attachment=True)

@app.route("/preview/<filename>")
def preview(filename):
    """Serve file for preview without triggering download"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found or has been cleaned up"}), 404
    
    # Determine mime type based on file extension
    if filename.endswith('.html'):
        mimetype = 'text/html'
    elif filename.endswith('.pdf'):
        mimetype = 'application/pdf'
    elif filename.endswith('.docx'):
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        mimetype = 'application/octet-stream'
    
    # Set appropriate headers for inline viewing and iframe embedding
    response = send_file(
        file_path, 
        as_attachment=False,
        mimetype=mimetype
    )
    
    # Add headers to allow iframe embedding
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self'"
    
    return response

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

@app.route("/debug/files")
def debug_files():
    """Debug endpoint to list files in output folder"""
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file_info = {
                "filename": filename,
                "size": os.path.getsize(file_path),
                "exists": os.path.exists(file_path)
            }
            files.append(file_info)
        
        return jsonify({
            "upload_folder": UPLOAD_FOLDER,
            "files": files,
            "html_conversion_available": HTML_CONVERSION_AVAILABLE
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
