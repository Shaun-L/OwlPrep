from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
from processing import process_pdf
from firebase_config import db
import firebase_admin
from firebase_admin import firestore, auth

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_current_user(header):
    print(request.headers, "Bye")
    print(request.headers)
    token = request.headers["Authorization"].split("Bearer ")[1]
    print(token, "Token")
    try:
        result = auth.verify_id_token(token)
        print(result)
        return result["uid"]
    except:
        return None


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
    print("Hello")
   
    if file_doc.exists:
        file_dic = file_doc.to_dict()
        file_data = {f'{file_dic["filename"]}':{"topics": [ topic["topic"] for topic in file_dic["topics"]]} }
    else:
        file_data = {}

    # Return both the processed topic_data and the file data from Firebase
    return jsonify({
        "message": "File processed successfully",
        "topics": topic_data,  # Return the topics from PDF processing
        "files": file_data  # Return the file document with topics and timestamp
    })

@app.route("/users", methods=["POST"])
def get_users():
    
    uid = get_current_user(header=request.headers)

    print(uid, "User")
    if(uid):
        try:
        # Get user ID (UID) from the request

            user_ref = db.collection("users").document(uid)
            user = user_ref.get()
            user_dict = user.to_dict()
            
            
        # Return user information as JSON
            return jsonify(user_dict), 200
        except firebase_admin.exceptions.FirebaseError as e:
            return jsonify({"error": f"Firebase error: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    
    return jsonify({"error": "Who"})
    
@app.route("/tests", methods=["GET"])
def get_tests():
    test_id = request.args.get("id", None)
    search_query = request.args.get("q", None)
    creator_query = request.args.get("creator", None)
    print(search_query)
    test_doc_ref = db.collection("tests")
    if test_id:
        test = test_doc_ref.document(test_id).get()
        return jsonify(test.to_dict()), 200
    
    if search_query:
        tests = test_doc_ref.get()
        
        matching_tests = []

        for test in tests:
            test_id = test.id
            test_dict = test.to_dict()
            if search_query.lower() in test_dict.get("name", "").lower():
                test_dict["id"] = test_id
                matching_tests.append(test_dict)
            else:
                for topic in test_dict.get("topics"):
                    if search_query.lower() in topic.lower():
                        test_dict["id"] = test_id
                        matching_tests.append(test_dict)
                        break 

        return jsonify({"tests": matching_tests}), 200
    
    if creator_query:
        tests = test_doc_ref.get()
        matching_tests = []
        print(creator_query)
        for test in tests:
            test_id = test.id
            test_dict = test.to_dict()
            print(test_dict.get("creator", ""))
            if creator_query == test_dict.get("creator", ""):
                test_dict["id"] = test_id
                matching_tests.append(test_dict)
        return jsonify({"tests": matching_tests}), 200
    
    tests = test_doc_ref.get()
    tests = tests[:24]
    test_to_return = []
    for test in tests:
        test_id = test.id
        test_dict = test.to_dict()
        test_dict["id"] = test_id
        test_to_return.append(test_dict)


    return jsonify({"tests": test_to_return}), 200

@app.route('/images', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if file:
        filepath = os.path.join("./static/images", file.filename)
        file.save(filepath)
        return jsonify({'message': f'File successfully saved at {filepath}'}), 200
    return jsonify({'error': 'No file selected'}), 400

    

@app.route('/images/<filename>', methods=['GET'])
def serve_image(filename):
    # Assuming your images are stored in a directory named 'static/images'
    image_path = os.path.join('static\\images', filename)
    return send_file(image_path, mimetype='image/jpeg')

@app.route('/login', methods=['POST'])
def login():
    # Parse user email and password from the request
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        # Authenticate the user via Firebase (requires Firebase Auth client-side)
        user = auth.get_user_by_email(email)
        # Normally you would verify the password yourself or delegate it to the frontend
        
        # Generate a custom token for the authenticated user
        custom_token = auth.create_custom_token(user.uid)
        
        return jsonify({"uid": user.uid, "token": custom_token.decode("utf-8")}), 200
    except firebase_admin._auth_utils.UserNotFoundError:
        return jsonify({"error": "Invalid email or user not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Something went wrong: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)