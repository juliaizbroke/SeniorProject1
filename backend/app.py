# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
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
WORD_TEMPLATES_FOLDER = "processing/templates/paper"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(WORD_TEMPLATES_FOLDER, exist_ok=True)

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
        
        # Check if file is an image
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            return jsonify({"error": "Invalid file format. Please upload an image file"}), 400
        
        # Create secure filename
        original_filename = secure_filename(file.filename)
        filename = f"{session_id}_{question_id}_{int(time.time())}_{original_filename}"
        
        # Save to images directory
        images_dir = os.path.join("processing", "templates", "images")
        os.makedirs(images_dir, exist_ok=True)
        
        file_path = os.path.join(images_dir, filename)
        file.save(file_path)
        
        # Register file for cleanup
        file_registry[file_path] = time.time()
        cleanup_thread = threading.Thread(target=cleanup_file_after_delay, args=(file_path,))
        cleanup_thread.start()
        
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

        exam_path, key_path = generate_word_files(questions, metadata, session_id, selected_template, shuffled_matching_order, selected_word_template)
        # Register Word files for automatic cleanup
        register_file_for_cleanup(exam_path)
        register_file_for_cleanup(key_path)
        # Remove HTML preview generation and related fields
        cleanup_expired_files()
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
