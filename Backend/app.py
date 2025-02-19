from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS  # Import CORS
import os
from processing import process_pdf
from firebase_config import db

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])


UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # Process PDF
    topic_data = process_pdf(file_path)

    # Store results in Firebase
    for topic, data in topic_data.items():
        db.collection("topics").add({
            "topic": topic,
            "text": data["text"],
            "files": data["files"]
        })

    return jsonify({"message": "File processed successfully", "topics": topic_data})

if __name__ == "__main__":
    app.run(debug=True)
