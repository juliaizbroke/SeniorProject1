# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from processing.parser import parse_excel
from processing.formatter import generate_word_files

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = "output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files['file']
    questions, metadata = parse_excel(file)
    session_id = str(uuid.uuid4())
    return jsonify({
        "session_id": session_id,
        "questions": questions,
        "metadata": metadata
    })

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    questions = data['questions']
    metadata = data['metadata']
    session_id = data['session_id']

    exam_path, key_path = generate_word_files(questions, metadata, session_id)

    return jsonify({
        "exam_url": f"/download/{os.path.basename(exam_path)}",
        "key_url": f"/download/{os.path.basename(key_path)}"
    })

@app.route("/download/<filename>")
def download(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename), as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
