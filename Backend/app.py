from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
from processing import process_pdf
from firebase_config import db
import firebase_admin
from firebase_admin import firestore

app = Flask(__name__)
CORS(app)

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
    filename = filename.replace("_", " ")

    # Process PDF
    topic_data = process_pdf(file_path)

    # Create a document for the file
    file_doc_ref = db.collection("files").document(filename)

    # Get current timestamp
    timestamp = firestore.SERVER_TIMESTAMP

    # Store topics under the file document
    topics_list = [
        {
            "topic": topic,
            "text": data["text"],
            "parent_file": filename
        }
        for topic, data in topic_data.items()
    ]

    # Set the document, ensuring it creates or updates the file entry
    file_doc_ref.set({
        "filename": filename,
        "topics": topics_list,
        "uploaded_at": timestamp  # Add the timestamp field
    }, merge=True)

    # Fetch the file document with its topics and timestamp
    file_doc = file_doc_ref.get()
    if file_doc.exists:
        file_data = file_doc.to_dict()
    else:
        file_data = {}

    # Return both the processed topic_data and the file data from Firebase
    return jsonify({
        "message": "File processed successfully",
        "topics": topic_data,  # Return the topics from PDF processing
        "file_data": file_data  # Return the file document with topics and timestamp
    })

if __name__ == "__main__":
    app.run(debug=True)
