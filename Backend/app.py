from flask import Flask, request, jsonify, send_file
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



@app.route("/users", methods=["GET"])
def get_users():

    uid = None

    if("Authorization" in request.headers):
        uid = get_current_user(header=request.headers)
    username = request.args.get("username", None)

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
        

    if(username):
        user_ref = db.collection("users")
        users = user_ref.get()

        for user in users:
            user_dict = user.to_dict()
            print()
            print()
            print("In User")
            print(user_dict)
            print()
            print()
            print()
            if(user_dict["username"] == username):
                del user_dict["email"]
                del user_dict["dark_theme"]
                return jsonify(user_dict), 200
        

    return jsonify({"error": "Who"})

@app.route("/tests", methods=["POST"])
def create_tests():
    if("Authorization" not in request.headers):
        return jsonify({'error': 'Not authorized'}), 401
    
    uid = get_current_user(header=request.headers)
    
    # Add questions from test generator
    if(uid):
        data = {
            "creator": uid,
            "name": request.json.get("name"),
            "difficulty": request.json.get("difficulty"),
            "questionTypes": request.json.get("questionTypes"),
            "questions": request.json.get("questions"),
            "topics": request.json.get("topics"),
            "type": request.json.get("type")
        }

        data = request.json
        test_name = data.get("name")  # New field
        test_description = data.get("test_description")  # New field
        topics = data.get("topics")  # List of topic names
        test_length = data.get("length")  # Short, Medium, Long
        difficulty = data.get("difficulty")  # Easy, Medium, Hard
        question_types = data.get("questionTypes")  # List of question types: ['MCQ', 'T/F', 'SAQ', 'SMQ'], for Multiple Choice, True/False, Short Answer Question, and Select Many

        # Map difficulty levels
        #og_difficulty = data.get("difficulty")
        #difficulty_map = {0: "Easy", 1: "Medium", 2: "Hard"}
        #difficulty = difficulty_map.get(og_difficulty, "Medium")  # Default to "Medium" if invalid 
    
        # Map Test Lengths
        #og_test_length = data.get("test_length")
        #test_length_map = {0: "Short", 1: "Medium", 2: "Long"}
        #test_length = test_length_map.get(og_test_length, "Medium")

    # Validate required fields
        if not all([uid, test_name, test_description, topics, test_length, difficulty, question_types]):
            return jsonify({"error": "Missing required fields"}), 400

    # Fetch the user's username
        user_doc_ref = db.collection("users").document(uid)
        user_doc = user_doc_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            # Dont really need to store in document -- creator_name = user_data.get("username", "Unknown")

        #doc_ref = db.collection("tests").document()  # Auto-generated ID
        #doc_ref.set(data)
        
        questions = generate_test(uid, topics, test_length, difficulty, question_types)


    # Create the final test object
        test = {
            "user": uid,
            #Dont really need "creator_name": creator_name,
            "test_name": test_name,
            "test_description": test_description,
            "difficulty": difficulty,
            "topics": topics,
            "type": "Practice Test",
            "question_types": question_types,
            "test_length": test_length,
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

    else:
        return jsonify({"Error": "error getting authentication"}), 200
    
    # Add document to Firestore

    return jsonify({"Success": "created test"}), 200
    


@app.route("/tests", methods=["GET"])
def get_tests():
    test_id = request.args.get("id", None)
    search_query = request.args.get("q", None)
    creator_query = request.args.get("creator", None)
    print(search_query)
    test_doc_ref = db.collection("tests")
    if test_id:
        test = test_doc_ref.document(test_id).get()
        test_dict = test.to_dict()
        uid = test_dict["creator"]
        user_ref = db.collection("users").document(uid)
        user = user_ref.get()
        user_dict = user.to_dict()
        del test_dict["creator"]
        del user_dict['email']
        del user_dict["dark_theme"]
        return jsonify({"test": test_dict, "creator": user_dict}), 200
    
    if search_query:
        tests = test_doc_ref.get()
        
        matching_tests = []

        for test in tests:
            test_id = test.id
            test_dict = test.to_dict()
            if search_query.lower() in test_dict.get("name", "").lower():
                test_dict["id"] = test_id
                uid = test_dict["creator"]
                user_ref = db.collection("users").document(uid)
                user = user_ref.get()
                user_dict = user.to_dict()
                del test_dict["creator"]
                del user_dict['email']
                del user_dict["dark_theme"]
                matching_tests.append({"test": test_dict, "creator": user_dict})
            else:
                for topic in test_dict.get("topics"):
                    if search_query.lower() in topic.lower():
                        test_dict["id"] = test_id
                        uid = test_dict["creator"]
                        user_ref = db.collection("users").document(uid)
                        user = user_ref.get()
                        user_dict = user.to_dict()
                        del test_dict["creator"]
                        del user_dict['email']
                        del user_dict["dark_theme"]
                        matching_tests.append({"test": test_dict, "creator": user_dict})
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
                uid = test_dict["creator"]
                user_ref = db.collection("users").document(uid)
                user = user_ref.get()
                user_dict = user.to_dict()
                del test_dict["creator"]
                del user_dict['email']
                del user_dict["dark_theme"]
                matching_tests.append({"test": test_dict, "creator": user_dict})
        return jsonify({"tests": matching_tests}), 200
    
    tests = test_doc_ref.get()
    tests = tests[:24]
    test_to_return = []
    for test in tests:
        test_id = test.id
        test_dict = test.to_dict()
        test_dict["id"] = test_id
        
        uid = test_dict["creator"]
        user_ref = db.collection("users").document(uid)
        user = user_ref.get()
        user_dict = user.to_dict()
        del test_dict["creator"]
        del user_dict['email']
        del user_dict["dark_theme"]
        test_to_return.append({"test": test_dict, "creator": user_dict})


    return jsonify({"tests": test_to_return}), 200

@app.route('/images', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    uid = get_current_user(header=request.headers)
    user_dict = None
    
    if(uid):
        try:
        # Get user ID (UID) from the request
            user_ref = db.collection("users").document(uid)
            user_ref.update({"img_url": f"http://127.0.0.1:5000/images/{file.filename}"})
            user = user_ref.get()
            print()
            print()
            print(user)
            user_dict = user.to_dict()
            print()
            print()
            print(user_dict)
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

    if file:
        filepath = os.path.join("./static/images", file.filename)
        file.save(filepath)
        if(user_dict):
            return jsonify({'message': f'File successfully saved at {filepath}', "user": user_dict}), 200
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