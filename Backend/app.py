from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import firebase_admin
from processing import process_pdf
from firebase_config import db
from firebase_admin import firestore, auth, credentials
from testgenerator import generate_test

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DEFAULT_PROFILE_PIC = "https://example.com/default-profile.jpg"  #


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")

    if not email or not password or not username:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        #Create user in Firebase Auth
        user = auth.create_user(email=email, password=password)

        #Store user details from firebase
        user_doc_ref = db.collection("users").document(user.uid)
        user_doc_ref.set({
            "email": email,
            "username": username,
            "profile_pic": DEFAULT_PROFILE_PIC
        })

        return jsonify({"message": "User registered successfully", "uid": user.uid})
    except Exception as e:
        return jsonify ({"error": str(e)}), 400


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    user = request.form.get("user")  # Get user from the request
    if not user:
        return jsonify({"error": "User not provided"}), 400

    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    filename = filename.replace("_", " ")

    # Process PDF
    topic_data = process_pdf(file_path)

    # Store topics under the user instead of files
    user_doc_ref = db.collection("users").document(user)

    topics_list = [
        {
            "topic": topic,
            "text": data["text"]
        }
        for topic, data in topic_data.items()
    ]

    # Add the topics to the user document
    user_doc_ref.set({
        "topics": topics_list
    }, merge=True)

    return jsonify({
        "message": "File processed successfully",
        "topics": topic_data
    })

@app.route("/generate-test", methods=["POST"])
def generate_test_route():
    data = request.json
    user = data.get("user") # passes the uid
    test_name = data.get("test_name")  # New field
    test_description = data.get("test_description")  # New field
    topics = data.get("topics")  # List of topic names
    # test_length = data.get("test_length")  # Short, Medium, Long
    # difficulty = data.get("difficulty")  # Easy, Medium, Hard
    question_types = data.get("question_types")  # List of question types: ['MCQ', 'T/F', 'SAQ', 'SMQ'], for Multiple Choice, True/False, Short Answer Question, and Select Many

    # Map difficulty levels
    og_difficulty = data.get("difficulty")
    difficulty_map = {0: "Easy", 1: "Medium", 2: "Hard"}
    difficulty = difficulty_map.get(og_difficulty, "Medium")  # Default to "Medium" if invalid 
    
    # Map Test Lengths
    og_test_length = data.get("test_length")
    test_length_map = {0: "Short", 1: "Medium", 2: "Long"}
    test_length = test_length_map.get(og_test_length, "Medium")

    # Validate required fields
    if not all([user, test_name, test_description, topics, test_length, difficulty, question_types]):
        return jsonify({"error": "Missing required fields"}), 400

    # Fetch the user's username
    user_doc_ref = db.collection("users").document(user)
    user_doc = user_doc_ref.get()

    if user_doc.exists:
        user_data = user_doc.to_dict()
        creator_name = user_data.get("username", "Unknown")
    else:
        creator_name = "Unknown"


    # Generate the test questions
    questions = generate_test(user, topics, test_length, difficulty, question_types)


    # Create the final test object
    test = {
        "user": user,
        "creator_name": creator_name,
        "test_name": test_name,
        "test_description": test_description,
        "difficulty": og_difficulty,
        "topics": topics,
        "type": "Practice Test",
        "question_types": question_types,
        "test_length": og_test_length,
        "questions": questions
    }

    # Save the generated test in the user's test collection
    try:

        _, test_ref = db.collection("tests").add(test)
        # _, test_ref = user_doc_ref.collection("tests").add(test)
        print(test_ref)
        
        # Return the response including the test ID for reference
        return jsonify({
            "message": "Test generated and saved successfully",
            "test_id": test_ref.id,
            "test": test
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
