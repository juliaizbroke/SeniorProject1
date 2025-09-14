# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import threading
import time
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from processing.parser import parse_excel
from processing.formatter import generate_word_files
from processing.similarity_analyzer import DocumentSimilarityAnalyzer

try:
    import mammoth
    HTML_CONVERSION_AVAILABLE = True
except ImportError:
    HTML_CONVERSION_AVAILABLE = False
    print("Warning: mammoth not available. HTML preview will be disabled.")

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = "output"
WORD_TEMPLATES_FOLDER = "processing/templates/paper"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(WORD_TEMPLATES_FOLDER, exist_ok=True)

# Initialize similarity analyzer
similarity_analyzer = DocumentSimilarityAnalyzer()

# Track recent session creation to prevent rapid duplicates
recent_sessions = {}  # IP -> last_session_time
SESSION_CREATION_COOLDOWN = 0.5  # seconds between session creation per IP

# Schedule automatic cleanup of old sessions
import threading
import time
def cleanup_old_sessions_periodically():
    while True:
        try:
            time.sleep(3600)  # Run every hour
            similarity_analyzer.cleanup_old_sessions(2)  # Clean sessions older than 2 hours
        except Exception as e:
            print(f"Error in periodic cleanup: {str(e)}")

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_sessions_periodically, daemon=True)
cleanup_thread.start()

# File cleanup configuration
FILE_EXPIRY_MINUTES = int(os.environ.get('FILE_EXPIRY_MINUTES', 3))  # Default 3 minutes
file_registry = {}  # Track files and their creation times

def startup_cleanup():
    """Clean up any existing files on server startup"""
    try:
        # 1. Clean exam files (existing functionality)
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                if filename.endswith(('.docx', '.html')):  # Include HTML files too
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    os.remove(file_path)
                    print(f"Startup cleanup: Removed exam file {filename}")
        
        # 2. Clean image files
        images_dir = os.path.join("processing", "templates", "images")
        if os.path.exists(images_dir):
            for filename in os.listdir(images_dir):
                file_path = os.path.join(images_dir, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    print(f"Startup cleanup: Removed image {filename}")
        
        # 3. Clean similarity sessions (all old sessions)
        similarity_analyzer.cleanup_old_sessions(0)  # Clean all sessions regardless of age
        print("Startup cleanup: Cleaned all similarity sessions")
        
        # 4. Reset file registry
        file_registry.clear()
        print("Startup cleanup: Reset file registry")
        
    except Exception as e:
        print(f"Error during startup cleanup: {e}")

# Perform startup cleanup
startup_cleanup()

def cleanup_file_after_delay(file_path, delay_minutes=None):
    """Delete file after specified delay in minutes"""
    if delay_minutes is None:
        delay_minutes = FILE_EXPIRY_MINUTES
    def delete_file():
        print(f"Starting {delay_minutes}-minute countdown for: {file_path}")
        time.sleep(delay_minutes * 60)  # Convert minutes to seconds
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleaned up file after {delay_minutes} minutes: {file_path}")
                # Remove from registry
                if file_path in file_registry:
                    del file_registry[file_path]
            else:
                print(f"File already deleted: {file_path}")
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

def register_file_for_cleanup(file_path, delay_minutes=None):
    """Register a file for cleanup tracking"""
    file_registry[file_path] = time.time()
    cleanup_delay = delay_minutes if delay_minutes is not None else FILE_EXPIRY_MINUTES
    print(f"Registering file for cleanup: {file_path} (delay: {cleanup_delay} minutes)")
    cleanup_file_after_delay(file_path, cleanup_delay)

def cleanup_images_folder_after_delay(delay_minutes=None):
    """Delete all files in the images folder after specified delay"""
    if delay_minutes is None:
        delay_minutes = FILE_EXPIRY_MINUTES
    def delete_images():
        time.sleep(delay_minutes * 60)  # Convert minutes to seconds
        try:
            images_dir = os.path.join("processing", "templates", "images")
            if os.path.exists(images_dir):
                # Get all files in images directory
                for filename in os.listdir(images_dir):
                    file_path = os.path.join(images_dir, filename)
                    if os.path.isfile(file_path):  # Only delete files, not subdirectories
                        try:
                            os.remove(file_path)
                            print(f"Bulk cleanup: Removed image {filename}")
                            # Remove from registry if it exists
                            if file_path in file_registry:
                                del file_registry[file_path]
                        except Exception as e:
                            print(f"Error removing image {filename}: {e}")
                print(f"Bulk images cleanup completed after {delay_minutes} minutes")
        except Exception as e:
            print(f"Error during bulk images cleanup: {e}")
    
    # Start cleanup in background thread
    cleanup_thread = threading.Thread(target=delete_images, daemon=True)
    cleanup_thread.start()
    print(f"Scheduled bulk images cleanup in {delay_minutes} minutes")

def cleanup_expired_files_after_delay(delay_minutes=None):
    """Run cleanup_expired_files() after specified delay"""
    if delay_minutes is None:
        delay_minutes = FILE_EXPIRY_MINUTES
    def delayed_cleanup():
        time.sleep(delay_minutes * 60)  # Convert minutes to seconds
        try:
            cleanup_expired_files()
            print(f"Expired files cleanup completed after {delay_minutes} minutes")
        except Exception as e:
            print(f"Error during delayed expired files cleanup: {e}")
    
    # Start cleanup in background thread
    cleanup_thread = threading.Thread(target=delayed_cleanup, daemon=True)
    cleanup_thread.start()
    print(f"Scheduled expired files cleanup in {delay_minutes} minutes")

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

        # Get duplicate detection settings from form data or use defaults.
        # Default now is to NOT remove duplicates; we only annotate unless explicitly requested.
        remove_duplicates = request.form.get('removeDuplicates', 'false').lower() == 'true'
        similarity_threshold = float(request.form.get('similarityThreshold', '0.8'))

        # Validate threshold
        if not 0.0 <= similarity_threshold <= 1.0:
            return jsonify({"error": "Similarity threshold must be between 0.0 and 1.0"}), 400
        
        questions, metadata = parse_excel(file, remove_duplicates=remove_duplicates, similarity_threshold=similarity_threshold)
        # If we removed duplicates, we still want annotation info on returned list for UI clarity.
        if remove_duplicates:
            try:
                from processing.duplicate_detector import QuestionDuplicateDetector
                detector = QuestionDuplicateDetector(similarity_threshold=similarity_threshold)
                questions, duplicate_info = detector.annotate_duplicates(questions)
                metadata.setdefault("duplicate_detection", {})
                metadata["duplicate_detection"]["post_removal_annotation"] = duplicate_info
            except Exception as e:
                print(f"Warning: could not annotate duplicates after removal: {e}")
        session_id = str(uuid.uuid4())
        return jsonify({
            "session_id": session_id,
            "questions": questions,
            "metadata": metadata
        })
    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@app.route("/upload-template", methods=["POST"])
def upload_template():
    try:
        if 'template' not in request.files:
            return jsonify({"error": "No template file in the request"}), 400
        
        file = request.files['template']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith('.docx'):
            return jsonify({"error": "Invalid file format. Please upload a Word document (.docx)"}), 400
        
        # Save the uploaded template to the templates directory
        template_path = os.path.join("processing", "templates", "uploaded_template.docx")
        os.makedirs(os.path.dirname(template_path), exist_ok=True)
        file.save(template_path)
        
        return jsonify({"success": True, "filename": file.filename})
    except Exception as e:
        print(f"Error processing template upload: {str(e)}")
        return jsonify({"error": f"Failed to process template file: {str(e)}"}), 500

@app.route("/upload-question-image", methods=["POST"])
def upload_question_image():
    """Upload an image for a specific question"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file in the request"}), 400
        
        file = request.files['image']
        question_id = request.form.get('question_id')
        session_id = request.form.get('session_id', 'default')
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not question_id:
            return jsonify({"error": "Question ID is required"}), 400
        
        # Check if file is an image (PNG or JPEG only)
        allowed_extensions = {'png', 'jpg', 'jpeg'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

        if file_extension not in allowed_extensions:
            return jsonify({"error": "Invalid file format. Please upload PNG or JPEG images only"}), 400
        
        # Create secure filename
        original_filename = secure_filename(file.filename)
        filename = f"{session_id}_{question_id}_{int(time.time())}_{original_filename}"
        
        # Save to images directory
        images_dir = os.path.join("processing", "templates", "images")
        os.makedirs(images_dir, exist_ok=True)
        
        file_path = os.path.join(images_dir, filename)
        file.save(file_path)
        
        # Note: Images are cleaned up in bulk 5 minutes after exam generation
        # Individual image tracking is no longer needed
        
        return jsonify({
            "success": True, 
            "filename": filename,
            "file_path": f"images/{filename}"
        })
    except Exception as e:
        print(f"Error processing image upload: {str(e)}")
        return jsonify({"error": f"Failed to process image file: {str(e)}"}), 500

@app.route("/images/<filename>")
def serve_image(filename):
    """Serve uploaded images"""
    try:
        images_dir = os.path.join("processing", "templates", "images")
        file_path = os.path.join(images_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Image not found"}), 404
            
        return send_file(file_path)
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        return jsonify({"error": f"Failed to serve image: {str(e)}"}), 500

@app.route("/check-template", methods=["GET"])
def check_template():
    """Check if an uploaded template exists"""
    try:
        template_path = os.path.join("processing", "templates", "uploaded_template.docx")
        exists = os.path.exists(template_path)
        
        filename = None
        if exists:
            # Try to get original filename (for now, just use the static name)
            filename = "uploaded_template.docx"
        
        return jsonify({"exists": exists, "filename": filename})
    except Exception as e:
        print(f"Error checking template: {str(e)}")
        return jsonify({"error": f"Failed to check template: {str(e)}"}), 500

@app.route("/delete-template", methods=["DELETE"])
def delete_template():
    """Delete the uploaded template"""
    try:
        template_path = os.path.join("processing", "templates", "uploaded_template.docx")
        
        if os.path.exists(template_path):
            os.remove(template_path)
            return jsonify({"success": True, "message": "Template deleted successfully"})
        else:
            return jsonify({"success": False, "message": "Template not found"}), 404
    except Exception as e:
        print(f"Error deleting template: {str(e)}")
        return jsonify({"error": f"Failed to delete template: {str(e)}"}), 500

@app.route("/download-template", methods=["GET"])
def download_template():
    """Download the default question bank template"""
    try:
        template_path = os.path.join("processing", "templates", "download", "question-bank-tpl-clean.xlsx")
        if os.path.exists(template_path):
            return send_file(template_path, as_attachment=True, download_name='question-bank-template.xlsx')
        else:
            return jsonify({"error": "Template file not found"}), 404
    except Exception as e:
        print(f"Error downloading template: {str(e)}")
        return jsonify({"error": f"Failed to download template: {str(e)}"}), 500

@app.route("/analyze-duplicates", methods=["POST"])
def analyze_duplicates():
    """Analyze questions for duplicates without removing them"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({"error": "Invalid file format. Please upload an Excel file (.xlsx or .xls)"}), 400
        
        # Parse without removing duplicates first to get all questions
        questions, metadata = parse_excel(file, remove_duplicates=False)
        
        # Get threshold from form data
        similarity_threshold = float(request.form.get('similarityThreshold', '0.8'))
        
        if not 0.0 <= similarity_threshold <= 1.0:
            return jsonify({"error": "Similarity threshold must be between 0.0 and 1.0"}), 400
        
        # Analyze duplicates
        from processing.duplicate_detector import QuestionDuplicateDetector
        detector = QuestionDuplicateDetector(similarity_threshold=similarity_threshold)
        
        duplicate_groups = detector.find_duplicate_groups(questions)
        
        # Format results for frontend
        duplicate_analysis = []
        for group in duplicate_groups:
            if len(group) > 1:  # Only groups with actual duplicates
                group_data = {
                    "questions": group,
                    "count": len(group),
                    "similarity_scores": []
                }
                
                # Calculate pairwise similarity scores within the group
                for i in range(len(group)):
                    for j in range(i + 1, len(group)):
                        similarity = detector.calculate_similarity(group[i], group[j])
                        group_data["similarity_scores"].append({
                            "question1_index": i,
                            "question2_index": j,
                            "similarity": similarity
                        })
                
                duplicate_analysis.append(group_data)
        
        return jsonify({
            "total_questions": len(questions),
            "duplicate_groups": len(duplicate_analysis),
            "total_duplicates": sum(len(group["questions"]) for group in duplicate_analysis),
            "similarity_threshold": similarity_threshold,
            "duplicate_analysis": duplicate_analysis
        })
        
    except Exception as e:
        print(f"Error analyzing duplicates: {str(e)}")
        return jsonify({"error": f"Failed to analyze duplicates: {str(e)}"}), 500

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        questions = data['questions']
        metadata = data['metadata']
        session_id = data['session_id']
        selected_template = data.get('selectedTemplate', 'default')  # Get Excel template choice
        selected_word_template = data.get('selectedWordTemplate', 'default')  # Get Word template choice
        shuffled_matching_order = data.get('shuffledMatchingOrder', None)  # Get shuffled order
        
        print(f"[DEBUG] Generate endpoint - selectedWordTemplate: {selected_word_template}")
        
        exam_path, key_path, images_used = generate_word_files(questions, metadata, session_id, selected_template, shuffled_matching_order, selected_word_template)
        
        # Register Word files for automatic cleanup
        register_file_for_cleanup(exam_path)
        register_file_for_cleanup(key_path)
        
        # Schedule bulk cleanup of all images using FILE_EXPIRY_MINUTES
        cleanup_images_folder_after_delay()
        # Schedule cleanup of expired files using FILE_EXPIRY_MINUTES
        cleanup_expired_files_after_delay()
        response_data = {
            "exam_url": f"/download/{os.path.basename(exam_path)}",
            "key_url": f"/download/{os.path.basename(key_path)}",
            "expires_in_minutes": FILE_EXPIRY_MINUTES
        }
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

@app.route("/cleanup-images", methods=["DELETE"])
def cleanup_images_immediately():
    """Manually trigger immediate cleanup of all images"""
    try:
        images_dir = os.path.join("processing", "templates", "images")
        deleted_count = 0
        deleted_files = []
        
        if os.path.exists(images_dir):
            for filename in os.listdir(images_dir):
                file_path = os.path.join(images_dir, filename)
                if os.path.isfile(file_path):
                    try:
                        os.remove(file_path)
                        deleted_files.append(filename)
                        deleted_count += 1
                        # Remove from registry if it exists
                        if file_path in file_registry:
                            del file_registry[file_path]
                    except Exception as e:
                        print(f"Error removing image {filename}: {e}")
        
        return jsonify({
            "message": f"Deleted {deleted_count} image files",
            "deleted_files": deleted_files
        })
    except Exception as e:
        return jsonify({"error": f"Failed to cleanup images: {str(e)}"}), 500

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

# Word Template Management Endpoints
@app.route("/upload-word-template", methods=["POST"])
def upload_word_template():
    """Upload a Word template file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Check if file is a Word document
        if not file.filename.lower().endswith(('.docx', '.doc')):
            return jsonify({"error": "Only Word documents (.docx, .doc) are allowed"}), 400
        
        # Save the file to the templates directory
        filename = secure_filename(file.filename)
        file_path = os.path.join(WORD_TEMPLATES_FOLDER, filename)
        file.save(file_path)
        
        return jsonify({
            "message": "Word template uploaded successfully",
            "filename": filename
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route("/word-templates", methods=["GET"])
def get_word_templates():
    """Get list of uploaded Word templates"""
    try:
        templates = []
        default_template = None
        
        # Check if there's a default.txt file that specifies the default template
        default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
        if os.path.exists(default_file_path):
            with open(default_file_path, 'r') as f:
                default_template = f.read().strip()
        
        # If no default.txt or file doesn't exist, use exam-paper-tpl_clean.docx as default
        if not default_template or not os.path.exists(os.path.join(WORD_TEMPLATES_FOLDER, default_template)):
            default_template = "exam-paper-tpl_clean.docx"
        
        for filename in os.listdir(WORD_TEMPLATES_FOLDER):
            if filename.lower().endswith(('.docx', '.doc')):
                file_path = os.path.join(WORD_TEMPLATES_FOLDER, filename)
                is_default = filename == default_template
                templates.append({
                    "id": filename,  # Use filename as ID
                    "filename": filename,
                    "name": filename,  # Use filename as display name
                    "size": os.path.getsize(file_path),
                    "isDefault": is_default
                })
        
        # Sort templates so default comes first
        templates.sort(key=lambda x: not x["isDefault"])
        
        return jsonify({"templates": templates}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get templates: {str(e)}"}), 500

@app.route("/word-templates/<template_id>/make-default", methods=["POST"])
def make_word_template_default(template_id):
    """Make a Word template the default one"""
    try:
        template_path = os.path.join(WORD_TEMPLATES_FOLDER, template_id)
        if not os.path.exists(template_path):
            return jsonify({"error": "Template not found"}), 404
        
        # Write the template_id to default.txt
        default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
        with open(default_file_path, 'w') as f:
            f.write(template_id)
        
        return jsonify({"message": f"Template {template_id} set as default"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to set default template: {str(e)}"}), 500

@app.route("/word-templates/<template_id>", methods=["DELETE"])
def delete_word_template(template_id):
    """Delete a Word template"""
    try:
        # Prevent deletion of the original template only
        if template_id == "exam-paper-tpl_clean.docx":
            return jsonify({"error": "Cannot delete the original template"}), 400
        
        template_path = os.path.join(WORD_TEMPLATES_FOLDER, template_id)
        if not os.path.exists(template_path):
            return jsonify({"error": "Template not found"}), 404
        
        # Check if this is the current default template
        default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
        current_default = None
        if os.path.exists(default_file_path):
            with open(default_file_path, 'r') as f:
                current_default = f.read().strip()
        
        # If we're deleting the current default, reset default to origin
        if current_default == template_id:
            with open(default_file_path, 'w') as f:
                f.write("exam-paper-tpl_clean.docx")
        
        # Delete the template file
        os.remove(template_path)
        
        return jsonify({"message": f"Template {template_id} deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to delete template: {str(e)}"}), 500

@app.route("/download-word-template", methods=["GET"])
def download_default_word_template():
    """Download the default Word template"""
    try:
        # Download the default exam paper template from the download folder
        template_path = os.path.join("processing", "templates", "download", "exam-paper-tpl_clean.docx")
        if os.path.exists(template_path):
            return send_file(template_path, as_attachment=True, download_name='exam-paper-template.docx')
        else:
            return jsonify({"error": "Default Word template not found"}), 404
    except Exception as e:
        print(f"Error downloading default word template: {str(e)}")
        return jsonify({"error": f"Failed to download template: {str(e)}"}), 500

# ===== SIMILARITY CHECKING API ROUTES =====

@app.route('/api/similarity/create-session', methods=['POST'])
def create_similarity_session():
    """Create a new similarity analysis session"""
    try:
        # Get client IP for rate limiting
        client_ip = request.remote_addr or 'unknown'
        current_time = time.time()
        
        print(f"Session creation request from {client_ip} at {current_time}")
        
        # Check for rapid session creation from same IP
        if client_ip in recent_sessions:
            time_since_last = current_time - recent_sessions[client_ip]
            print(f"Last session from {client_ip} was {time_since_last:.2f} seconds ago")
            if time_since_last < SESSION_CREATION_COOLDOWN:
                wait_time = SESSION_CREATION_COOLDOWN - time_since_last
                print(f"Rate limiting triggered for {client_ip}, wait_time: {wait_time:.2f}s")
                return jsonify({
                    "success": False,
                    "error": "rate_limit",
                    "message": f"Please wait {wait_time:.1f} seconds before creating another session",
                    "wait_time": wait_time,
                    "retry_after": wait_time
                }), 429
        
        # Update recent sessions tracking
        recent_sessions[client_ip] = current_time
        print(f"Updated recent_sessions for {client_ip}")
        
        # Clean up old entries (older than 5 minutes)
        cutoff_time = current_time - 300  # 5 minutes
        recent_sessions_cleaned = {ip: timestamp for ip, timestamp in recent_sessions.items() 
                          if timestamp > cutoff_time}
        recent_sessions.clear()
        recent_sessions.update(recent_sessions_cleaned)
        
        session_id = similarity_analyzer.create_session()
        print(f"Successfully created session: {session_id}")
        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Session created successfully"
        }), 200
    except Exception as e:
        print(f"Error creating similarity session: {str(e)}")
        return jsonify({"success": False, "error": f"Failed to create session: {str(e)}"}), 500

@app.route('/api/similarity/upload/<session_id>', methods=['POST'])
def upload_similarity_files(session_id):
    """Upload Word documents for similarity analysis"""
    try:
        if 'files' not in request.files:
            return jsonify({"error": "No files provided"}), 400
        
        files = request.files.getlist('files')
        
        if len(files) < 2:
            return jsonify({"error": "At least 2 files required for comparison"}), 400
        
        session_path = os.path.join(similarity_analyzer.temp_base_dir, session_id)
        if not os.path.exists(session_path):
            return jsonify({"error": "Session not found"}), 404
        
        uploaded_files_path = os.path.join(session_path, "uploaded_files")
        uploaded_files = []
        
        for file in files:
            if file.filename and file.filename.endswith('.docx'):
                filename = secure_filename(file.filename)
                # Ensure unique filename
                if filename in [f["name"] for f in uploaded_files]:
                    name, ext = os.path.splitext(filename)
                    filename = f"{name}_{int(time.time())}{ext}"
                
                file_path = os.path.join(uploaded_files_path, filename)
                file.save(file_path)
                
                uploaded_files.append({
                    "name": filename,
                    "original_name": file.filename,
                    "size": os.path.getsize(file_path),
                    "upload_time": time.time()
                })
        
        if len(uploaded_files) < 2:
            return jsonify({"error": "At least 2 valid .docx files required"}), 400
        
        # Update session info
        session_info_path = os.path.join(session_path, "session_info.json")
        with open(session_info_path, 'r') as f:
            session_info = json.load(f)
        
        session_info["files_uploaded"] = uploaded_files
        
        with open(session_info_path, 'w') as f:
            json.dump(session_info, f, indent=2)
        
        return jsonify({
            "success": True,
            "files_uploaded": len(uploaded_files),
            "files": uploaded_files,
            "message": f"Successfully uploaded {len(uploaded_files)} files"
        }), 200
        
    except Exception as e:
        print(f"Error uploading similarity files: {str(e)}")
        return jsonify({"error": f"Failed to upload files: {str(e)}"}), 500

@app.route('/api/similarity/analyze/<session_id>', methods=['POST'])
def analyze_similarity(session_id):
    """Analyze similarity between uploaded documents"""
    try:
        results = similarity_analyzer.analyze_session(session_id)
        return jsonify({
            "success": True,
            "results": results,
            "message": "Analysis completed successfully"
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error analyzing similarity: {str(e)}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route('/api/similarity/results/<session_id>', methods=['GET'])
def get_similarity_results(session_id):
    """Get similarity analysis results"""
    try:
        results = similarity_analyzer.get_session_results(session_id)
        return jsonify({
            "success": True,
            "results": results
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        print(f"Error getting similarity results: {str(e)}")
        return jsonify({"error": f"Failed to get results: {str(e)}"}), 500

@app.route('/api/similarity/cleanup/<session_id>', methods=['DELETE'])
def cleanup_similarity_session(session_id):
    """Clean up a specific similarity session"""
    try:
        success = similarity_analyzer.cleanup_session(session_id)
        if success:
            return jsonify({
                "success": True,
                "message": "Session cleaned up successfully"
            }), 200
        else:
            return jsonify({"error": "Session not found or cleanup failed"}), 404
            
    except Exception as e:
        print(f"Error cleaning up session: {str(e)}")
        return jsonify({"error": f"Cleanup failed: {str(e)}"}), 500

@app.route('/api/similarity/cleanup-all', methods=['DELETE'])
def cleanup_all_similarity_sessions():
    """Clean up all old similarity sessions"""
    try:
        max_age_hours = request.args.get('max_age_hours', 2, type=int)
        cleaned_count = similarity_analyzer.cleanup_old_sessions(max_age_hours)
        return jsonify({
            "success": True,
            "cleaned_sessions": cleaned_count,
            "message": f"Cleaned up {cleaned_count} old sessions"
        }), 200
        
    except Exception as e:
        print(f"Error cleaning up all sessions: {str(e)}")
        return jsonify({"error": f"Cleanup failed: {str(e)}"}), 500

@app.route('/api/similarity/cleanup-empty', methods=['DELETE'])
def cleanup_empty_similarity_sessions():
    """Clean up empty similarity sessions immediately"""
    try:
        if not os.path.exists(similarity_analyzer.temp_base_dir):
            return jsonify({"success": True, "cleaned_sessions": 0, "message": "No sessions to clean"}), 200
        
        cleaned_count = 0
        for session_folder in os.listdir(similarity_analyzer.temp_base_dir):
            if session_folder.startswith("similarity_"):
                session_path = os.path.join(similarity_analyzer.temp_base_dir, session_folder)
                if os.path.isdir(session_path):
                    # Check if session has no uploaded files
                    uploaded_files_path = os.path.join(session_path, "uploaded_files")
                    if os.path.exists(uploaded_files_path):
                        uploaded_files = [f for f in os.listdir(uploaded_files_path) if f.endswith('.docx')]
                        if len(uploaded_files) == 0:
                            if similarity_analyzer.cleanup_session(session_folder):
                                cleaned_count += 1
                                print(f"Cleaned up empty session: {session_folder}")
        
        return jsonify({
            "success": True,
            "cleaned_sessions": cleaned_count,
            "message": f"Cleaned up {cleaned_count} empty sessions"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Empty session cleanup failed: {str(e)}"}), 500

@app.route('/api/similarity/status', methods=['GET'])
def similarity_system_status():
    """Get similarity system status"""
    try:
        temp_dir = similarity_analyzer.temp_base_dir
        active_sessions = 0
        total_size = 0
        
        if os.path.exists(temp_dir):
            for session_folder in os.listdir(temp_dir):
                if session_folder.startswith("similarity_"):
                    active_sessions += 1
                    session_path = os.path.join(temp_dir, session_folder)
                    for root, dirs, files in os.walk(session_path):
                        for file in files:
                            total_size += os.path.getsize(os.path.join(root, file))
        
        return jsonify({
            "success": True,
            "status": {
                "active_sessions": active_sessions,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "temp_directory": temp_dir,
                "threshold": similarity_analyzer.similarity_threshold
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting similarity status: {str(e)}")
        return jsonify({"error": f"Status check failed: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
