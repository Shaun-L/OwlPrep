from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import firebase_admin
from processing import process_pdf
from firebase_config import db
from firebase_admin import firestore, auth, credentials
from testgenerator import generate_test, generate_question
from datetime import datetime
import json


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
    
    uid = get_current_user(header=request.headers)

    #user = request.form.get("user")  # Get user from the request
    if not uid:
        return jsonify({"error": "User not provided"}), 400

    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    filename = filename.replace("_", " ")

    # Process PDF
    try:
        topic_data = process_pdf(file_path)

        # Store topics under the user instead of files
        user_doc_ref = db.collection("users").document(uid)

        topics_list = []
        for topic, data in topic_data.items():
            # Check if text is a string or a list and handle accordingly
            if isinstance(data["text"], list):
                text_content = "\n\n".join(data["text"])
            else:
                text_content = data["text"]
                
            topics_list.append({
            "topic": topic,
                "text": text_content
            })

    # Add the topics to the user document
        user_doc_ref.set({
            "topics": topics_list
        }, merge=True)

        print("File processed successfully")

    # Return both the processed topic_data and the file data from Firebase
        return jsonify({
            "message": "File processed successfully",
            "topics": topic_data,  # Return the topics from PDF processing
        })
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@app.route("/users", methods=["PUT"])
def update_user():
    try:
        uid = get_current_user(header=request.headers)

    #user = request.form.get("user")  # Get user from the request
        if not uid:
            return jsonify({"error": "User not provided"}), 400
        data = request.json  # Get JSON request body
        user_ref = db.collection("users").document(uid)

        if user_ref.get().exists:
            user_ref.update(data)
            updated_user = user_ref.get().to_dict()
            return jsonify({"success": True, "message": "User updated successfully", "user": updated_user})
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    
    except auth.InvalidIdTokenError:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    except auth.ExpiredIdTokenError:
        return jsonify({"success": False, "message": "Token expired"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500



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

@app.route("/users/saves", methods=["GET"])
def get_saved_tests():
    try:
        uid = get_current_user(header=request.headers)  # Get user ID
        if not uid:
            return jsonify({"error": "User not provided"}), 400
        
        user_ref = db.collection("users").document(uid)
        user_data = user_ref.get()
        
        if not user_data.exists:
            return jsonify({"error": "User not found"}), 404
        
        saved_test_ids = user_data.to_dict().get("saves", [])
        
        # Fetch test objects using the IDs
        tests = []
        for test_id in saved_test_ids:
            test_doc = db.collection("tests").document(test_id).get()
            
            if test_doc.exists:
                test_id = test_doc.id
                test_dict = test_doc.to_dict()
                test_dict["id"] = test_id
                creator_id = test_dict["user"]
                user_ref = db.collection("users").document(creator_id)
                user = user_ref.get()
                user_dict = user.to_dict()
                del test_dict["user"]
                del user_dict['email']
                del user_dict["dark_theme"]
                tests.append({"test": test_dict, "creator": user_dict})
        
        return jsonify({"success": True, "saved_tests": tests})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/tests", methods=["POST"])
def create_tests():
    if("Authorization" not in request.headers):
        return jsonify({'error': 'Not authorized'}), 401
    
    uid = get_current_user(header=request.headers)
    
    # Add questions from test generator
    if(uid):
        # data = {
        #     "creator": uid,
        #     "name": request.json.get("name"),
        #     "difficulty": request.json.get("difficulty"),
        #     "questionTypes": request.json.get("questionTypes"),
        #     "questions": request.json.get("questions"),
        #     "topics": request.json.get("topics"),
        #     "type": request.json.get("type")
        # }

        data = request.json
        test_name = data.get("name")  # New field
        test_description = data.get("description")  # New field
        topics = data.get("topics")  # List of topic names
        test_length = data.get("length")  # Short, Medium, Long
        difficulty = data.get("difficulty")  # Easy, Medium, Hard
        question_types = data.get("questionTypes")  # List of question types: ['MCQ', 'T/F', 'SAQ', 'SMQ'], for Multiple Choice, True/False, Short Answer Question, and Select Many

        # Map difficulty levels
        #og_difficulty = data.get("difficulty")
        difficulty_map = {0: "Easy", 1: "Medium", 2: "Hard"}
        difficulty = difficulty_map.get(difficulty, "Medium")  # Default to "Medium" if invalid 
    
        # Map Test Lengths
        #og_test_length = data.get("test_length")
        test_length_map = {0: "Short", 1: "Medium", 2: "Long"}
        test_length = test_length_map.get(test_length, "Medium")

        print(uid, test_name, test_description, topics, test_length, difficulty, question_types )
    # Validate required fields
        # if not all([uid, test_name, test_description, topics, test_length, difficulty, question_types]):
        #     return jsonify({"error": "Missing required fields"}), 400

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
            "name": test_name,
            "description": test_description,
            "difficulty": difficulty,
            "topics": topics,
            "type": "Practice Test",
            "question_types": question_types,
            "test_length": test_length,
            "questions": questions,
            "created": datetime.now().strftime("%m/%d/%y")
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
            }), 201
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
    question_number = request.args.get("question", None)

    print(search_query)
    
    if test_id:
        # First, check in regular tests collection
        test_doc = db.collection("tests").document(test_id).get()
        test_dict = None
        
        # If test exists in regular tests collection
        if test_doc.exists:
            test_dict = test_doc.to_dict()
        else:
            # If not in regular tests, check in daily quizzes
            daily_quiz_doc = db.collection("daily_quizzes").document(test_id).get()
            if daily_quiz_doc.exists:
                test_dict = daily_quiz_doc.to_dict()
        
        # If test_dict is still None, test doesn't exist in either collection
        if not test_dict:
            return jsonify({"error": "Test not found"}), 404

        if question_number:
            # Check if questions key exists and the question number is valid
            if "questions" not in test_dict or question_number not in test_dict["questions"]:
                return jsonify({"error": "Question not found"}), 404
                
            question_to_send = test_dict["questions"][question_number]
            
            return jsonify({
                "question": question_to_send, 
                "test_length": len(test_dict["questions"]), 
                "test_name": test_dict.get("name", "Daily Quiz")
            }), 200
        else:
            uid = test_dict.get("user")
            if not uid:
                return jsonify({"error": "User information missing"}), 400
                
            user_ref = db.collection("users").document(uid)
            user = user_ref.get()
            
            if not user.exists:
                return jsonify({"error": "User not found"}), 404
                
            user_dict = user.to_dict()
            
            # Make a copy of test_dict to modify
            response_test_dict = test_dict.copy()
            
            # Only delete if key exists to avoid KeyError
            if "user" in response_test_dict:
                del response_test_dict["user"]
                
            # Make a copy of user_dict to modify
            response_user_dict = user_dict.copy()
            
            # Only delete if keys exist to avoid KeyError
            if "email" in response_user_dict:
                del response_user_dict["email"]
            if "dark_theme" in response_user_dict:
                del response_user_dict["dark_theme"]
            
            return jsonify({"test": response_test_dict, "creator": response_user_dict}), 200
    
    if search_query:
        tests = db.collection("tests").get()
        
        matching_tests = []

        for test in tests:
            test_id = test.id
            test_dict = test.to_dict()
            if search_query.lower() in test_dict.get("name", "").lower():
                test_dict["id"] = test_id
                uid = test_dict["user"]
                user_ref = db.collection("users").document(uid)
                user = user_ref.get()
                user_dict = user.to_dict()
                del test_dict["user"]
                del user_dict['email']
                del user_dict["dark_theme"]
                matching_tests.append({"test": test_dict, "creator": user_dict})
            else:
                for topic in test_dict.get("topics"):
                    if search_query.lower() in topic.lower():
                        test_dict["id"] = test_id
                        uid = test_dict["user"]
                        user_ref = db.collection("users").document(uid)
                        user = user_ref.get()
                        user_dict = user.to_dict()
                        del test_dict["user"]
                        del user_dict['email']
                        del user_dict["dark_theme"]
                        matching_tests.append({"test": test_dict, "creator": user_dict})
                        break 

        return jsonify({"tests": matching_tests}), 200
    
    if creator_query:

        users_ref = db.collection('users')  # Replace 'users' with the name of your Firestore collection
        query = users_ref.where('username', '==', creator_query).limit(1).stream()

        user_data = None
        user_id = None
        for doc in query:
            user_data = doc.to_dict()
            user_id = doc.id

        if not user_data:
            return jsonify({'status': 'failure', 'message': 'User not found'}), 404
        
        print()
        print()
        print()
        print(user_data)
        print()
        print()
        print()
        print(user_id)


        tests = db.collection("tests").get()
        user_ref = db.collection("users").document(user_id)
        user = user_ref.get()
        user_dict = user.to_dict()
        del user_dict['email']
        del user_dict["dark_theme"]
        matching_tests = []
        
        print(creator_query)
        for test in tests:
            test_id = test.id
            test_dict = test.to_dict()
            print(test_dict.get("user", ""))
            if user_id == test_dict.get("user", ""):
                test_dict["id"] = test_id
                del test_dict["user"]
                matching_tests.append(test_dict)
        return jsonify({"tests": matching_tests, "creator": user_dict}), 200

    
    tests = db.collection("tests").get()
    tests = tests[:24]
    test_to_return = []
    for test in tests:
        test_id = test.id
        test_dict = test.to_dict()
        test_dict["id"] = test_id
        
        uid = test_dict["user"]
        user_ref = db.collection("users").document(uid)
        user = user_ref.get()
        user_dict = user.to_dict()
        del test_dict["user"]
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
    # Use os.path.join with forward slashes for cross-platform compatibility
    image_path = os.path.join('static', 'images', filename)
    
    # Check if file exists
    if not os.path.exists(image_path):
        # If the requested file is the default profile image and it doesn't exist,
        # return a 404 with a helpful message
        if filename == 'default-profile.jpg':
            return jsonify({
                "error": "Default profile image not found. Please upload a profile image or contact support."
            }), 404
        return jsonify({"error": "Image not found"}), 404
        
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

# @app.route("/generate-test", methods=["POST"])
# def generate_test_route():
#     data = request.json
#     user = data.get("user") # passes the uid
#     test_name = data.get("test_name")  # New field
#     test_description = data.get("test_description")  # New field
#     topics = data.get("topics")  # List of topic names
#     # test_length = data.get("test_length")  # Short, Medium, Long
#     # difficulty = data.get("difficulty")  # Easy, Medium, Hard
#     question_types = data.get("question_types")  # List of question types: ['MCQ', 'T/F', 'SAQ', 'SMQ'], for Multiple Choice, True/False, Short Answer Question, and Select Many

#     # Map difficulty levels
#     og_difficulty = data.get("difficulty")
#     difficulty_map = {0: "Easy", 1: "Medium", 2: "Hard"}
#     difficulty = difficulty_map.get(og_difficulty, "Medium")  # Default to "Medium" if invalid 
    
#     # Map Test Lengths
#     og_test_length = data.get("test_length")
#     test_length_map = {0: "Short", 1: "Medium", 2: "Long"}
#     test_length = test_length_map.get(og_test_length, "Medium")

#     # Validate required fields
#     if not all([user, test_name, test_description, topics, test_length, difficulty, question_types]):
#         return jsonify({"error": "Missing required fields"}), 400

#     # Fetch the user's username
#     user_doc_ref = db.collection("users").document(user)
#     user_doc = user_doc_ref.get()

#     if user_doc.exists:
#         user_data = user_doc.to_dict()
#         creator_name = user_data.get("username", "Unknown")
#     else:
#         creator_name = "Unknown"


#     # Generate the test questions
#     questions = generate_test(user, topics, test_length, difficulty, question_types)


#     # Create the final test object
#     test = {
#         "user": user,
#         "creator_name": creator_name,
#         "test_name": test_name,
#         "test_description": test_description,
#         "difficulty": og_difficulty,
#         "topics": topics,
#         "type": "Practice Test",
#         "question_types": question_types,
#         "test_length": og_test_length,
#         "questions": questions
#     }

#     # Save the generated test in the user's test collection
#     try:

#         _, test_ref = db.collection("tests").add(test)
#         # _, test_ref = user_doc_ref.collection("tests").add(test)
#         print(test_ref)
        
#         # Return the response including the test ID for reference
#         return jsonify({
#             "message": "Test generated and saved successfully",
#             "test_id": test_ref.id,
#             "test": test
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 400



### TEST CREATION ###


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

    estimated_time_map = {"Short": 20, "Medium": 40, "Long": 60}
    estimated_time = estimated_time_map[test_length]
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
        "estimated_time": estimated_time,
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

@app.route("/tests/<test_id>/share", methods=["GET"])
def get_shared_test(test_id):
    """
    Get a test by ID without requiring authentication for sharing.
    This endpoint allows anyone with the test ID to access the test.
    """
    print(f"Accessing shared test with ID: {test_id}")
    try:
        # Get the test document
        test_doc = db.collection("tests").document(test_id).get()
        
        if not test_doc.exists:
            print(f"Test not found: {test_id}")
            return jsonify({"error": "Test not found"}), 404
            
        test_data = test_doc.to_dict()
        print(f"Test found: {test_data.get('title', 'Untitled')}")
        
        # Create a shareable version (exclude certain fields)
        shareable_test = {
            "id": test_id,
            "title": test_data.get("title", "Shared Test"),
            "description": test_data.get("description", ""),
            "type": test_data.get("type", "Quiz"),
            "questions": test_data.get("questions", []),
            "shared": True,
            "original_user": test_data.get("user"),  # Keep track of original creator
            "created_at": test_data.get("created_at")
        }
        
        return jsonify(shareable_test), 200
        
    except Exception as e:
        print(f"Error retrieving shared test: {str(e)}")
        return jsonify({"error": f"Error retrieving test: {str(e)}"}), 500

@app.route("/tests/<test_id>/clone", methods=["POST"])
def clone_shared_test(test_id):
    """
    Clone a shared test for the current user.
    """
    try:
        # Check authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get the original test
        test_doc = db.collection("tests").document(test_id).get()
        if not test_doc.exists:
            return jsonify({"error": "Test not found"}), 404
            
        original_test = test_doc.to_dict()
        
        # Create a clone for the current user
        cloned_test = {
            "title": f"{original_test.get('title', 'Shared Test')} (Cloned)",
            "description": original_test.get("description", ""),
            "type": original_test.get("type", "Quiz"),
            "questions": original_test.get("questions", []),
            "user": uid,
            "cloned_from": test_id,
            "original_user": original_test.get("user"),
            "created_at": firestore.SERVER_TIMESTAMP,
        }
        
        # Add to database
        _, test_ref = db.collection("tests").add(cloned_test)
        
        return jsonify({
            "id": test_ref.id,
            "message": "Test cloned successfully"
        }), 201
        
    except Exception as e:
        print(f"Error cloning test: {str(e)}")
        return jsonify({"error": f"Error cloning test: {str(e)}"}), 500 

### Test Grader ###
@app.route("/submit-test", methods=["POST"])
def submit_test_route():
    data = request.json
    user = data.get("user")  # UID
    test_id = data.get("test_id")  # ID of the original test
    answers_list = data.get("answers")  # List of {question_id, answer} objects

    if not all([user, test_id, answers_list]):
        return jsonify({"error": "Missing required fields"}), 400

    # Convert list of answers to dictionary format
    user_answers = {answer["question_id"]: answer["answer"] for answer in answers_list}

    # Load the original test
    test_doc = db.collection("tests").document(test_id).get()
    if not test_doc.exists:
        return jsonify({"error": "Test not found"}), 404

    test_data = test_doc.to_dict()

    # Now call the submit_test function
    from submittest import submit_test
    submitted_test, score_percentage, points_earned, points_possible = submit_test(user, test_id, test_data, user_answers)

    # Include original test data in the submission
    submitted_test.update({
        "test_name": test_data.get("name", ""),
        "test_description": test_data.get("description", ""),
        "original_test_id": test_id,
        "topics": test_data.get("topics", []),
        "question_types": test_data.get("question_types", []),
        "difficulty": test_data.get("difficulty", ""),
        "created": datetime.now().strftime("%m/%d/%y")
    })

    try:
        _, submission_ref = db.collection("submitted_tests").add(submitted_test)

        return jsonify({
            "message": "Test submitted successfully",
            "submission_id": submission_ref.id,
            "score_percentage": score_percentage,
            "points_earned": points_earned,
            "points_possible": points_possible,
            "submitted_test": submitted_test
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/topics/recommendations", methods=["GET"])
def get_topic_recommendations():
    try:
        # Get the current user from the authorization header
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        # Get user's submitted tests to analyze performance
        submitted_tests_ref = db.collection("submitted_tests")
        user_submissions = submitted_tests_ref.where("user", "==", uid).get()

        # Dictionary to store topic performance
        topic_performance = {}
        topic_count = {}

        # Analyze submitted tests
        for submission in user_submissions:
            submission_data = submission.to_dict()
            test_id = submission_data.get("test_id")
            
            # Get the original test to see topics
            test_doc = db.collection("tests").document(test_id).get()
            if not test_doc.exists:
                continue
                
            test_data = test_doc.to_dict()
            topics = test_data.get("topics", [])
            score = submission_data.get("score", 0)
            
            # Update topic performance
            for topic in topics:
                if topic not in topic_performance:
                    topic_performance[topic] = 0
                    topic_count[topic] = 0
                topic_performance[topic] += score
                topic_count[topic] += 1

        # Calculate average performance per topic
        topic_averages = {}
        for topic in topic_performance:
            if topic_count[topic] > 0:
                topic_averages[topic] = topic_performance[topic] / topic_count[topic]

        # Get all available topics from user's uploaded materials
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404

        user_data = user_doc.to_dict()
        all_topics = [topic["topic"] for topic in user_data.get("topics", [])]

        # Sort topics by performance (lower scores need more practice)
        recommended_topics = []
        for topic in all_topics:
            if topic in topic_averages:
                recommended_topics.append({
                    "topic": topic,
                    "performance": topic_averages[topic],
                    "needs_practice": topic_averages[topic] < 70  # Flag topics with <70% average
                })
            else:
                # Topics not yet tested
                recommended_topics.append({
                    "topic": topic,
                    "performance": None,
                    "needs_practice": True
                })

        # Sort by needs_practice (True first) and then by performance (lower first)
        recommended_topics.sort(key=lambda x: (not x["needs_practice"], x["performance"] if x["performance"] is not None else float('inf')))

        return jsonify({
            "recommendations": recommended_topics[:5],  # Return top 5 recommendations
            "message": "Successfully retrieved topic recommendations"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/topics/explain", methods=["POST"])
def get_topic_explanation():
    try:
        # Get the current user from the authorization header
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        # Get the topic from the request
        data = request.json
        topic = data.get("topic")
        question_id = data.get("question_id")  # Optional: for specific question explanations

        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        # Get user's uploaded materials
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404

        user_data = user_doc.to_dict()
        user_topics = user_data.get("topics", [])

        # Find the topic in user's materials
        topic_data = None
        for t in user_topics:
            if t["topic"].lower() == topic.lower():
                topic_data = t
                break

        if not topic_data:
            return jsonify({"error": "Topic not found in user's materials"}), 404

        # If a specific question is requested, get its context
        question_context = None
        if question_id:
            # Get the test that contains this question
            submitted_tests_ref = db.collection("submitted_tests")
            user_submissions = submitted_tests_ref.where("user", "==", uid).get()
            
            for submission in user_submissions:
                submission_data = submission.to_dict()
                questions = submission_data.get("questions", [])
                for q in questions:
                    if q.get("id") == question_id:
                        question_context = {
                            "question": q.get("question"),
                            "user_answer": q.get("user_answer"),
                            "correct_answer": q.get("correct_answer"),
                            "score": q.get("score")
                        }
                        break
                if question_context:
                    break

        # Get related topics for additional context
        related_topics = []
        for t in user_topics:
            if t["topic"].lower() != topic.lower() and any(word in t["topic"].lower() for word in topic.lower().split()):
                related_topics.append(t["topic"])

        # Construct the explanation
        explanation = {
            "topic": topic_data["topic"],
            "explanation": topic_data["text"],  # The main content from user's materials
            "related_topics": related_topics[:3],  # Up to 3 related topics
            "question_context": question_context,  # If a specific question was requested
            "study_tips": [
                "Review the main concepts in the explanation",
                "Practice with related topics",
                "Create flashcards for key terms"
            ]
        }

        # If there's question context, add specific feedback
        if question_context:
            if question_context["score"] < 1:  # If the question was answered incorrectly
                explanation["feedback"] = {
                    "message": "It looks like you had trouble with this question. Here's what you need to know:",
                    "key_points": [
                        "Focus on understanding the main concept",
                        "Note the differences between your answer and the correct answer",
                        "Review the explanation above for clarification"
                    ]
                }

        return jsonify({
            "explanation": explanation,
            "message": "Successfully retrieved topic explanation"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cheatsheet/generate", methods=["POST"])
def generate_cheatsheet():
    try:
        # Check for authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get the request data
        data = request.json
        
        # Extract cheatsheet details
        cheatsheet_name = data.get("name")
        topics = data.get("topics", [])
        hint_level = data.get("hint_level", 1)  # 0=Easy, 1=Medium, 2=Hard
        cheatsheet_size = data.get("size", 1)  # 0=Small, 1=Medium, 2=Large
        hint_types = data.get("hint_types", [])  # Definitions, Examples, Graphics, Bullets
        
        # Validate required fields
        if not all([cheatsheet_name, topics, hint_types]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Make sure we have at least one topic
        if len(topics) == 0:
            return jsonify({"error": "At least one topic is required"}), 400
        
        # Make sure we have at least one hint type
        if len(hint_types) == 0:
            return jsonify({"error": "At least one hint type is required"}), 400
        
        # Fetch topic content for selected topics
        topic_content = {}
        user_doc_ref = db.collection("users").document(uid)
        user_doc = user_doc_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        user_topics = user_data.get("topics", [])
        
        for topic_name in topics:
            for topic in user_topics:
                if topic["topic"] == topic_name:
                    topic_content[topic_name] = topic["text"]
                    break
        
        # Map hint level and size to descriptive terms
        hint_level_map = {0: "Easy", 1: "Medium", 2: "Hard"}
        size_map = {0: "3x5 Index Card", 1: "8.5x11 One Side", 2: "8.5x11 Two Sides"}
        
        hint_level_desc = hint_level_map.get(hint_level, "Medium")
        size_desc = size_map.get(cheatsheet_size, "8.5x11 One Side")
        
        # Calculate content limits based on size
        max_content_length = {
            0: 250,   # 3x5 Index Card - about 250 words
            1: 500,   # 8.5x11 One Side - about 500 words
            2: 1000,  # 8.5x11 Two Sides - about 1000 words
        }.get(cheatsheet_size, 500)
        
        # Generate the cheatsheet content using OpenAI
        from processing import client
        
        # Prepare the hint types text
        hint_types_text = ", ".join(hint_types)
        
        # Build the cheatsheet content with OpenAI
        cheatsheet_content = ""
        
        for topic_name, content in topic_content.items():
            prompt = f"""
            Create a concise cheatsheet section for the topic "{topic_name}" based on the following content:
            
            {content[:2000]}  # Limit content to prevent prompt size issues
            
            The cheatsheet should:
            1. Be formatted for a {size_desc}
            2. Include {hint_types_text}
            3. Be at a {hint_level_desc} level of detail
            4. Be concise and well-organized
            5. Prioritize the most important information
            6. Include any formulas, key definitions, and critical concepts
            
            Format the response as markdown with clear headings, bullet points, and sections.
            """
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are an expert at creating concise, well-organized study guides and cheatsheets."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1500,
                )
                
                topic_content_generated = response.choices[0].message.content.strip()
                cheatsheet_content += f"\n\n## {topic_name}\n\n{topic_content_generated}"
                
            except Exception as e:
                print(f"Error generating content for topic {topic_name}: {str(e)}")
                return jsonify({"error": f"Error generating cheatsheet content: {str(e)}"}), 500
        
        # Create the final cheatsheet object
        cheatsheet = {
            "user": uid,
            "name": cheatsheet_name,
            "topics": topics,
            "hint_level": hint_level,
            "hint_level_desc": hint_level_desc,
            "size": cheatsheet_size,
            "size_desc": size_desc,
            "hint_types": hint_types,
            "content": cheatsheet_content,
            "created": datetime.now().strftime("%m/%d/%y"),
            "type": "Cheatsheet"
        }
        
        # Save the cheatsheet to Firestore
        cheatsheet_ref = db.collection("cheatsheets").add(cheatsheet)
        cheatsheet_id = cheatsheet_ref[1].id
        
        return jsonify({
            "message": "Cheatsheet generated successfully",
            "cheatsheet_id": cheatsheet_id,
            "cheatsheet": cheatsheet
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Error generating cheatsheet: {str(e)}"}), 500

@app.route("/cheatsheet/<cheatsheet_id>", methods=["GET"])
def get_cheatsheet(cheatsheet_id):
    try:
        # Check for authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get the cheatsheet from Firestore
        cheatsheet_doc = db.collection("cheatsheets").document(cheatsheet_id).get()
        
        if not cheatsheet_doc.exists:
            return jsonify({"error": "Cheatsheet not found"}), 404
        
        cheatsheet_data = cheatsheet_doc.to_dict()
        
        # Verify that the user is authorized to view this cheatsheet
        if cheatsheet_data.get("user") != uid:
            return jsonify({"error": "Unauthorized to view this cheatsheet"}), 403
        
        # Return the cheatsheet
        return jsonify({
            "cheatsheet": cheatsheet_data,
            "id": cheatsheet_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error retrieving cheatsheet: {str(e)}"}), 500

@app.route("/cheatsheets", methods=["GET"])
def get_user_cheatsheets():
    try:
        # Check for authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get all cheatsheets for the user
        cheatsheets_ref = db.collection("cheatsheets").where("user", "==", uid)
        cheatsheets = cheatsheets_ref.get()
        
        # Format the response
        cheatsheets_list = []
        for cheatsheet in cheatsheets:
            cheatsheet_data = cheatsheet.to_dict()
            cheatsheet_data["id"] = cheatsheet.id
            cheatsheets_list.append(cheatsheet_data)
        
        return jsonify({
            "cheatsheets": cheatsheets_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error retrieving cheatsheets: {str(e)}"}), 500

@app.route("/cheatsheet/download/<cheatsheet_id>", methods=["GET"])
def download_cheatsheet(cheatsheet_id):
    try:
        # Check for authorization in headers or query parameters
        token = None
        
        # First check headers
        if "Authorization" in request.headers:
            token_header = request.headers["Authorization"]
            if token_header.startswith("Bearer "):
                token = token_header.split("Bearer ")[1]
        
        # If not in headers, check query parameters
        if not token and "token" in request.args:
            token = request.args.get("token")
        
        if not token:
            return jsonify({"error": "Not authorized"}), 401
        
        # Verify token
        try:
            uid = auth.verify_id_token(token)["uid"]
        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
        
        # Get the cheatsheet from Firestore
        cheatsheet_doc = db.collection("cheatsheets").document(cheatsheet_id).get()
        
        if not cheatsheet_doc.exists:
            return jsonify({"error": "Cheatsheet not found"}), 404
        
        cheatsheet_data = cheatsheet_doc.to_dict()
        
        # Verify that the user is authorized to download this cheatsheet
        if cheatsheet_data.get("user") != uid:
            return jsonify({"error": "Unauthorized to download this cheatsheet"}), 403
        
        # Get the cheatsheet content
        cheatsheet_content = cheatsheet_data.get("content", "")
        cheatsheet_name = cheatsheet_data.get("name", "cheatsheet")
        
        # Create a simple HTML document from the markdown content
        from flask import make_response
        import markdown
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{cheatsheet_name}</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                h1 {{ color: #2c3e50; }}
                h2 {{ color: #3498db; border-bottom: 1px solid #eee; padding-bottom: 5px; }}
                h3 {{ color: #2980b9; }}
                ul {{ padding-left: 20px; }}
                pre {{ background-color: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }}
                code {{ font-family: monospace; }}
                .formula {{ background-color: #f2f2f2; padding: 5px; border-radius: 3px; }}
                .definition {{ font-style: italic; }}
                .important {{ font-weight: bold; color: #e74c3c; }}
                .page-break {{ page-break-after: always; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                img {{ max-width: 100%; }}
            </style>
        </head>
        <body>
            <h1>{cheatsheet_name}</h1>
            {markdown.markdown(cheatsheet_content)}
        </body>
        </html>
        """
        
        # Create a response with the HTML content
        response = make_response(html_content)
        response.headers["Content-Type"] = "text/html"
        response.headers["Content-Disposition"] = f"attachment; filename={cheatsheet_name.replace(' ', '_')}.html"
        
        return response
        
    except Exception as e:
        return jsonify({"error": f"Error downloading cheatsheet: {str(e)}"}), 500

@app.route("/resources/recommend", methods=["GET"])
def get_resource_recommendations():
    try:
        # Get the current user from the authorization header
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        # Get optional topic filter from query parameters
        topic_filter = request.args.get("topic")
        resource_type = request.args.get("type", "all")  # all, video, article, practice

        # Get user's topics and performance
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404

        user_data = user_doc.to_dict()
        user_topics = [t["topic"] for t in user_data.get("topics", [])]

        # Get user's performance data
        submitted_tests_ref = db.collection("submitted_tests")
        user_submissions = submitted_tests_ref.where("user", "==", uid).get()
        
        # Calculate topic performance
        topic_performance = {}
        topic_count = {}
        for submission in user_submissions:
            submission_data = submission.to_dict()
            test_id = submission_data.get("test_id")
            test_doc = db.collection("tests").document(test_id).get()
            if test_doc.exists:
                test_data = test_doc.to_dict()
                topics = test_data.get("topics", [])
                score = submission_data.get("score", 0)
                for topic in topics:
                    if topic not in topic_performance:
                        topic_performance[topic] = 0
                        topic_count[topic] = 0
                    topic_performance[topic] += score
                    topic_count[topic] += 1

        # Calculate average performance per topic
        topic_averages = {}
        for topic in topic_performance:
            if topic_count[topic] > 0:
                topic_averages[topic] = topic_performance[topic] / topic_count[topic]

        # Define resource types and their sources
        resource_types = {
            "video": {
                "sources": ["YouTube", "Khan Academy", "Coursera"],
                "format": "video tutorial"
            },
            "article": {
                "sources": ["Wikipedia", "Medium", "Academic Papers"],
                "format": "written explanation"
            },
            "practice": {
                "sources": ["Quizlet", "Practice Problems", "Interactive Exercises"],
                "format": "practice material"
            }
        }

        # Generate recommendations
        recommendations = []
        topics_to_recommend = [topic_filter] if topic_filter else user_topics

        for topic in topics_to_recommend:
            performance = topic_averages.get(topic, None)
            needs_help = performance is None or performance < 70

            # Determine which resource types to recommend based on performance
            if needs_help:
                # If struggling, recommend all types
                types_to_include = ["video", "article", "practice"]
            else:
                # If doing well, recommend practice to maintain
                types_to_include = ["practice"]

            # Filter by requested resource type
            if resource_type != "all":
                types_to_include = [resource_type] if resource_type in types_to_include else []

            for r_type in types_to_include:
                for source in resource_types[r_type]["sources"]:
                    recommendation = {
                        "topic": topic,
                        "type": r_type,
                        "source": source,
                        "format": resource_types[r_type]["format"],
                        "description": f"{source} {resource_types[r_type]['format']} for {topic}",
                        "priority": "high" if needs_help else "medium",
                        "estimated_time": "10-15 minutes" if r_type == "video" else "5-10 minutes" if r_type == "article" else "15-20 minutes"
                    }
                    recommendations.append(recommendation)

        # Sort recommendations by priority and topic performance
        recommendations.sort(key=lambda x: (
            x["priority"] == "high",  # High priority first
            topic_averages.get(x["topic"], 0)  # Then by topic performance
        ))

        return jsonify({
            "recommendations": recommendations[:10],  # Return top 10 recommendations
            "message": "Successfully retrieved resource recommendations",
            "filters_applied": {
                "topic": topic_filter,
                "resource_type": resource_type
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/progress", methods=["GET"])
def get_progress_track():
    try:
        # Check for authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get user information
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        user_topics = [t["topic"] for t in user_data.get("topics", [])]
        
        # Get submitted tests data
        submitted_tests_ref = db.collection("submitted_tests").where("user", "==", uid)
        submitted_tests = submitted_tests_ref.get()
        
        # Process test data
        tests_data = []
        total_tests = 0
        total_score = 0
        topic_performance = {}
        topic_count = {}
        daily_quiz_performance = []
        practice_test_performance = []
        test_history = []
        
        for test in submitted_tests:
            test_data = test.to_dict()
            test_id = test.id
            
            # Extract basic test info
            score_percentage = test_data.get("score_percentage", 0)
            points_earned = test_data.get("points_earned", 0)
            points_possible = test_data.get("points_possible", 1)  # Avoid division by zero
            test_date = test_data.get("created", "Unknown")
            test_name = test_data.get("test_name", f"Test {test_id}")
            test_type = test_data.get("type", "Practice Test")
            is_daily = "Daily Quiz" in test_name
            
            # Add to test history
            test_history.append({
                "id": test_id,
                "name": test_name,
                "score": score_percentage,
                "date": test_date,
                "type": "Daily Quiz" if is_daily else "Practice Test"
            })
            
            # Update aggregated statistics
            total_tests += 1
            total_score += score_percentage
            
            # Get the original test to extract topic information
            original_test_id = test_data.get("original_test_id")
            if original_test_id:
                original_test_doc = db.collection("tests").document(original_test_id).get()
                if original_test_doc.exists:
                    original_test_data = original_test_doc.to_dict()
                    test_topics = original_test_data.get("topics", [])
                    
                    # Track performance by topic
                    for topic in test_topics:
                        if topic not in topic_performance:
                            topic_performance[topic] = 0
                            topic_count[topic] = 0
                        topic_performance[topic] += score_percentage
                        topic_count[topic] += 1
                    
                    # Track performance by test type
                    if is_daily:
                        daily_quiz_performance.append({
                            "date": test_date,
                            "score": score_percentage
                        })
                    else:
                        practice_test_performance.append({
                            "date": test_date,
                            "score": score_percentage
                        })
        
        # Calculate average performance by topic
        topic_averages = []
        for topic, score in topic_performance.items():
            if topic_count[topic] > 0:
                topic_averages.append({
                    "topic": topic,
                    "performance": round(score / topic_count[topic], 1)
                })
        
        # Sort topics by performance (for best/worst)
        topic_averages.sort(key=lambda x: x["performance"], reverse=True)
        
        # Calculate overall statistics
        avg_score = round(total_score / total_tests, 1) if total_tests > 0 else 0
        
        # Create response object
        progress_data = {
            "overall_stats": {
                "total_tests": total_tests,
                "average_score": avg_score
            },
            "topic_performance": topic_averages,
            "best_topics": topic_averages[:3] if len(topic_averages) >= 3 else topic_averages,
            "worst_topics": topic_averages[-3:][::-1] if len(topic_averages) >= 3 else sorted(topic_averages, key=lambda x: x["performance"]),
            "daily_quiz_performance": sorted(daily_quiz_performance, key=lambda x: x["date"]),
            "practice_test_performance": sorted(practice_test_performance, key=lambda x: x["date"]),
            "test_history": sorted(test_history, key=lambda x: x["date"], reverse=True)
        }
        
        return jsonify({
            "progress_data": progress_data,
            "message": "Successfully retrieved progress data"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error retrieving progress data: {str(e)}"}), 500

@app.route("/pathway/recommend", methods=["GET"])
def get_pathway_recommend():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/quiz/daily", methods=["GET"])
def get_daily_quiz():
    # Check for authorization
    if("Authorization" not in request.headers):
        return jsonify({'error': 'Not authorized'}), 401
    
    uid = get_current_user(header=request.headers)
    if not uid:
        return jsonify({"error": "Authentication error"}), 401
    
    # Get today's date to check if daily quiz already exists
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Check if user already has a quiz for today in the tests collection
    tests_ref = db.collection("tests").where("user", "==", uid).where("type", "==", "Daily Quiz").where("date", "==", today)
    existing_quiz = tests_ref.get()
    
    if len(existing_quiz) > 0:
        # Quiz already exists, return it
        quiz_doc = existing_quiz[0]
        quiz_data = quiz_doc.to_dict()
        quiz_id = quiz_doc.id
        return jsonify({
            "message": "Daily quiz retrieved",
            "quiz_id": quiz_id,
            "quiz": quiz_data
        }), 200
    
    # Fetch user's topics
    user_doc_ref = db.collection("users").document(uid)
    user_doc = user_doc_ref.get()
    
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404
    
    user_data = user_doc.to_dict()
    user_topics = user_data.get("topics", [])
    
    # Check if user has uploaded any topics
    if not user_topics or len(user_topics) == 0:
        return jsonify({"error": "No topics found. Upload study materials first."}), 400
    
    # Select 3 random topics (or fewer if user has less than 3)
    import random
    num_topics = min(3, len(user_topics))
    selected_topics = random.sample([topic["topic"] for topic in user_topics], num_topics)
    
    # Ensure balanced question types
    question_types = ["MCQ", "T/F", "SAQ", "SMQ"]
    
    # Generate questions with testgenerator.py
    try:
        # We'll use "Short" to generate 10 questions
        questions = generate_test(uid, selected_topics, "Short", "Medium", question_types)
        
        # Make sure we have exactly 10 questions
        question_items = list(questions.items())
        if len(question_items) > 10:
            question_items = question_items[:10]
        elif len(question_items) < 10:
            # If we don't have enough questions, log this issue
            logging.warning(f"Daily quiz generated only {len(question_items)} questions instead of 10")
            
            # We should not need this fallback since we fixed the generate_test function,
            # but keeping it as an extra precaution
            while len(question_items) < 10:
                # Generate more questions to fill in the gaps
                additional_questions = generate_test(uid, selected_topics, "Short", "Medium", question_types)
                additional_items = list(additional_questions.items())
                
                # Add new questions until we reach 10
                for item in additional_items:
                    if len(question_items) >= 10:
                        break
                    # Only add if not a duplicate question number
                    if item[0] not in [q[0] for q in question_items]:
                        question_items.append(item)
        
        # Ensure questions are numbered sequentially from 1-10
        questions = {}
        for i, (_, question_data) in enumerate(question_items[:10], 1):
            questions[str(i)] = question_data
        
        # Create the daily quiz object
        daily_quiz = {
            "user": uid,
            "name": f"Daily Quiz - {today}",
            "description": f"Daily practice quiz with {len(selected_topics)} topic(s): {', '.join(selected_topics)}",
            "difficulty": "Medium",
            "topics": selected_topics,
            "type": "Daily Quiz",  # Use this to identify daily quizzes
            "question_types": question_types,
            "test_length": "Short",  # Always short for daily quizzes
            "questions": questions,
            "date": today,
            "created": datetime.now().strftime("%m/%d/%y"),
            "is_daily": True  # Additional field to easily identify daily quizzes
        }
        
        # Verify we have exactly 10 questions
        if len(daily_quiz["questions"]) != 10:
            return jsonify({"error": f"Failed to generate exactly 10 questions. Generated {len(daily_quiz['questions'])} instead."}), 500
        
        # Save the generated quiz in the regular tests collection
        quiz_ref = db.collection("tests").add(daily_quiz)
        quiz_id = quiz_ref[1].id
        
        return jsonify({
            "message": "Daily quiz generated successfully",
            "quiz_id": quiz_id,
            "quiz": daily_quiz
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Error generating daily quiz: {str(e)}"}), 500


@app.route("/tests/share", methods=["POST"])
def share_test():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/tests/download/:id", methods=["GET"])
def download_test():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/feedback", methods=["POST"])
def submit_feedback():
    try:
        # Check for authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get the feedback data
        data = request.json
        feedback_topic = data.get("topic")
        feedback_content = data.get("content")
        
        # Validate required fields
        if not feedback_topic or not feedback_content:
            return jsonify({"error": "Missing required fields"}), 400
            
        # Create feedback object
        feedback = {
            "user": uid,
            "topic": feedback_topic,
            "content": feedback_content,
            "created": datetime.now().strftime("%m/%d/%y"),
            "status": "pending"  # pending, reviewed, resolved
        }
        
        # Save the feedback to Firestore
        feedback_ref = db.collection("feedback").add(feedback)
        feedback_id = feedback_ref[1].id
        
        return jsonify({
            "message": "Feedback submitted successfully",
            "feedback_id": feedback_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Error submitting feedback: {str(e)}"}), 500

@app.route("/submitted-tests/<submission_id>", methods=["GET"])
def get_submitted_test(submission_id):
    try:
        # Get the current user from the authorization header
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        # Get the submitted test from Firestore
        submission_doc = db.collection("submitted_tests").document(submission_id).get()
        
        if not submission_doc.exists:
            return jsonify({"error": "Submitted test not found"}), 404

        submission_data = submission_doc.to_dict()

        # Verify that the user is authorized to view this submission
        if submission_data.get("user") != uid:
            return jsonify({"error": "Unauthorized to view this submission"}), 403

        return jsonify(submission_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/submitted-tests", methods=["GET"])
def get_user_submitted_tests():
    try:
        # Get the current user from the authorization header
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        try:
            # Try to get all submitted tests for the user with ordering
            submitted_tests_ref = db.collection("submitted_tests")
            user_submissions = submitted_tests_ref.where("user", "==", uid).order_by("created", direction=firestore.Query.DESCENDING).get()
        except Exception as index_error:
            # If the index isn't ready, fall back to just filtering by user
            print("Index not ready, falling back to basic query:", str(index_error))
            submitted_tests_ref = db.collection("submitted_tests")
            user_submissions = submitted_tests_ref.where("user", "==", uid).get()
        
        submitted_tests = []
        for submission in user_submissions:
            test_data = submission.to_dict()
            test_data["id"] = submission.id  # Include the document ID
            submitted_tests.append(test_data)

        # Sort the results manually if we had to fall back to the basic query
        if not isinstance(user_submissions, firestore.Query):
            submitted_tests.sort(key=lambda x: x.get("created", ""), reverse=True)

        return jsonify({
            "submitted_tests": submitted_tests,
            "message": "Successfully retrieved submitted tests"
        }), 200

    except Exception as e:
        print("Error fetching submitted tests:", str(e))  # Add logging
        return jsonify({"error": str(e)}), 500

# Add the new adaptive learning pathway endpoints
@app.route("/adaptive-pathway/start", methods=["POST"])
def start_adaptive_pathway():
    """
    Start a new adaptive learning pathway session based on selected topics.
    """
    try:
        # Check authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get request data
        data = request.json
        selected_topics = data.get("topics", [])
        
        if not selected_topics:
            return jsonify({"error": "At least one topic must be selected"}), 400
        
        # Fetch user's topics data
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
            
        user_data = user_doc.to_dict()
        user_topics = user_data.get("topics", [])
        
        # Verify topics exist
        valid_topics = []
        topic_texts = {}
        
        for topic_name in selected_topics:
            topic_found = False
            for topic in user_topics:
                if topic["topic"] == topic_name:
                    valid_topics.append(topic_name)
                    topic_texts[topic_name] = topic["text"]
                    topic_found = True
                    break
            
            if not topic_found:
                return jsonify({"error": f"Topic '{topic_name}' not found in user's materials"}), 400
        
        # Generate initial questions (5 questions)
        question_types = ["MCQ", "T/F", "SAQ", "SMQ"]
        questions = generate_adaptive_questions(uid, valid_topics, topic_texts, 5, question_types)
        
        # Create a new pathway session
        pathway_session = {
            "user": uid,
            "topics": valid_topics,
            "current_round": 1,
            "total_rounds": 0,
            "question_types": question_types,
            "questions": questions,
            "answers": {},
            "topic_mastery": {topic: 0 for topic in valid_topics},  # 0% mastery to start
            "created": datetime.now().strftime("%m/%d/%y"),
            "last_updated": datetime.now().strftime("%m/%d/%y"),
            "status": "active"
        }
        
        # Save the session
        session_ref = db.collection("adaptive_pathways").add(pathway_session)
        session_id = session_ref[1].id
        
        # Return the session data with questions
        return jsonify({
            "session_id": session_id,
            "topics": valid_topics,
            "current_round": 1,
            "questions": questions,
            "topic_mastery": pathway_session["topic_mastery"]
        }), 201
        
    except Exception as e:
        print(f"Error starting adaptive pathway: {str(e)}")
        return jsonify({"error": f"Error starting adaptive pathway: {str(e)}"}), 500

@app.route("/adaptive-pathway/<session_id>/submit", methods=["POST"])
def submit_adaptive_answers(session_id):
    """
    Submit answers for the current round and get new questions based on performance.
    """
    try:
        # Check authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get answers from request
        data = request.json
        answers = data.get("answers", {})
        
        if not answers:
            return jsonify({"error": "No answers provided"}), 400
        
        # Get the pathway session
        session_doc = db.collection("adaptive_pathways").document(session_id).get()
        if not session_doc.exists:
            return jsonify({"error": "Pathway session not found"}), 404
            
        session_data = session_doc.to_dict()
        
        # Verify user owns this session
        if session_data.get("user") != uid:
            return jsonify({"error": "Unauthorized to access this pathway session"}), 403
            
        # Verify session is active
        if session_data.get("status") != "active":
            return jsonify({"error": "Pathway session is no longer active"}), 400
            
        # Grade the answers
        questions = session_data.get("questions", {})
        correct_count = 0
        total_questions = len(answers)
        
        results = {}
        topic_performance = {}
        
        for question_id, user_answer in answers.items():
            if question_id in questions:
                question = questions[question_id]
                correct = is_answer_correct(question, user_answer)
                
                # Track performance by topic
                topic = question.get("topic")
                if topic not in topic_performance:
                    topic_performance[topic] = {"correct": 0, "total": 0}
                
                topic_performance[topic]["total"] += 1
                if correct:
                    correct_count += 1
                    topic_performance[topic]["correct"] += 1
                
                results[question_id] = {
                    "correct": correct,
                    "question": question["question"],
                    "user_answer": user_answer,
                    "correct_answer": question["answer"] if question["type"] != "SAQ" else question["expected_answer"]
                }
        
        # Update topic mastery
        topic_mastery = session_data.get("topic_mastery", {})
        
        for topic, perf in topic_performance.items():
            if perf["total"] > 0:
                # Add 10% mastery if all correct, 5% if some correct, -5% if all wrong
                correct_ratio = perf["correct"] / perf["total"]
                
                if correct_ratio == 1.0:
                    # All correct - add 10%
                    mastery_change = 10
                elif correct_ratio > 0:
                    # Some correct - add 5%
                    mastery_change = 5
                else:
                    # All wrong - subtract 5% (but not below 0)
                    mastery_change = -5
                
                topic_mastery[topic] = max(0, min(100, topic_mastery[topic] + mastery_change))
        
        # Update session with new data
        current_round = session_data.get("current_round", 1) + 1
        all_topics_mastered = all(mastery >= 90 for mastery in topic_mastery.values())
        
        # Decide if we should continue or end the session
        if all_topics_mastered:
            status = "completed"
            new_questions = {}
        else:
            status = "active"
            # Generate new questions, focusing on topics with lower mastery
            low_mastery_topics = [t for t, m in topic_mastery.items() if m < 90]
            
            # Get topic texts
            user_doc = db.collection("users").document(uid).get()
            user_data = user_doc.to_dict()
            user_topics = user_data.get("topics", [])
            
            topic_texts = {}
            for topic_data in user_topics:
                if topic_data["topic"] in low_mastery_topics:
                    topic_texts[topic_data["topic"]] = topic_data["text"]
            
            # Generate new questions based on weaker topics
            new_questions = generate_adaptive_questions(
                uid, 
                low_mastery_topics, 
                topic_texts,
                5, 
                session_data.get("question_types", ["MCQ", "T/F"])
            )
        
        # Save all results
        session_ref = db.collection("adaptive_pathways").document(session_id)
        
        # Update the session
        session_ref.update({
            "current_round": current_round,
            "total_rounds": session_data.get("total_rounds", 0) + 1,
            "answers": {**session_data.get("answers", {}), **answers},
            "topic_mastery": topic_mastery,
            "questions": new_questions,
            "last_updated": datetime.now().strftime("%m/%d/%y"),
            "status": status
        })
        
        # Return session progress and next questions
        round_score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        return jsonify({
            "session_id": session_id,
            "current_round": current_round,
            "round_results": {
                "score": round_score,
                "correct": correct_count,
                "total": total_questions,
                "question_results": results
            },
            "topic_mastery": topic_mastery,
            "questions": new_questions,
            "status": status,
            "all_topics_mastered": all_topics_mastered
        }), 200
        
    except Exception as e:
        print(f"Error submitting adaptive pathway answers: {str(e)}")
        return jsonify({"error": f"Error submitting answers: {str(e)}"}), 500

@app.route("/adaptive-pathway/<session_id>", methods=["GET"])
def get_adaptive_pathway_session(session_id):
    """
    Get the current state of an adaptive learning pathway session.
    """
    try:
        # Check authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get the pathway session
        session_doc = db.collection("adaptive_pathways").document(session_id).get()
        if not session_doc.exists:
            return jsonify({"error": "Pathway session not found"}), 404
            
        session_data = session_doc.to_dict()
        
        # Verify user owns this session
        if session_data.get("user") != uid:
            return jsonify({"error": "Unauthorized to access this pathway session"}), 403
        
        # Return session data
        return jsonify({
            "session_id": session_id,
            "topics": session_data.get("topics", []),
            "current_round": session_data.get("current_round", 1),
            "total_rounds": session_data.get("total_rounds", 0),
            "questions": session_data.get("questions", {}),
            "topic_mastery": session_data.get("topic_mastery", {}),
            "status": session_data.get("status", "active")
        }), 200
        
    except Exception as e:
        print(f"Error getting adaptive pathway session: {str(e)}")
        return jsonify({"error": f"Error retrieving session: {str(e)}"}), 500

@app.route("/adaptive-pathway/list", methods=["GET"])
def list_adaptive_pathways():
    """
    List all adaptive learning pathway sessions for the user.
    """
    try:
        # Check authorization
        if "Authorization" not in request.headers:
            return jsonify({"error": "Not authorized"}), 401
        
        uid = get_current_user(header=request.headers)
        if not uid:
            return jsonify({"error": "Authentication error"}), 401
        
        # Get all pathway sessions for this user
        sessions_ref = db.collection("adaptive_pathways").where("user", "==", uid).get()
        
        sessions = []
        for doc in sessions_ref:
            session_data = doc.to_dict()
            sessions.append({
                "id": doc.id,
                "topics": session_data.get("topics", []),
                "current_round": session_data.get("current_round", 1),
                "total_rounds": session_data.get("total_rounds", 0),
                "topic_mastery": session_data.get("topic_mastery", {}),
                "status": session_data.get("status", "active"),
                "created": session_data.get("created", ""),
                "last_updated": session_data.get("last_updated", "")
            })
        
        return jsonify({
            "sessions": sessions
        }), 200
        
    except Exception as e:
        print(f"Error listing adaptive pathways: {str(e)}")
        return jsonify({"error": f"Error listing sessions: {str(e)}"}), 500

def generate_adaptive_questions(uid, topics, topic_texts, num_questions, question_types):
    """
    Generate adaptive questions focusing on the provided topics.
    This is a simplified version that distributes questions evenly among topics.
    """
    questions = {}
    question_number = 1
    
    # Distribute questions evenly among topics
    questions_per_topic = max(1, num_questions // len(topics))
    remaining_questions = num_questions - (questions_per_topic * len(topics))
    
    for topic in topics:
        topic_question_count = questions_per_topic + (1 if remaining_questions > 0 else 0)
        remaining_questions -= 1 if remaining_questions > 0 else 0
        
        # Get topic text
        text = topic_texts.get(topic)
        if not text:
            continue
            
        # Get question types to use
        types_to_use = question_types.copy()
        
        # Generate questions for this topic
        for i in range(topic_question_count):
            # Select a question type
            q_type = types_to_use[i % len(types_to_use)]
            
            # Generate the question
            question_data = generate_question(topic, text, q_type, "Medium", [])
            
            if question_data and len(question_data) > 0:
                q = question_data[0]
                
                # Add to questions
                questions[str(question_number)] = {
                    "question": q["question"],
                    "options": q.get("choices", []),
                    "answer": q.get("answer", q.get("expected_answer", "")),
                    "expected_answer": q.get("expected_answer", ""),
                    "type": q["type"],
                    "topic": topic
                }
                
                question_number += 1
    
    return questions

def is_answer_correct(question, user_answer):
    """
    Check if the user's answer is correct based on the question type.
    """
    q_type = question.get("type")
    
    if q_type == "MCQ" or q_type == "T/F":
        # For multiple choice and true/false, compare indices
        try:
            correct_answer = int(question.get("answer"))
            user_answer_int = int(user_answer)
            return correct_answer == user_answer_int
        except:
            return False
            
    elif q_type == "SMQ":
        # For select many, compare arrays of indices
        try:
            correct_answers = question.get("answer", [])
            
            # Convert user_answer to list if it's a string
            if isinstance(user_answer, str):
                try:
                    user_answer = json.loads(user_answer)
                except:
                    return False
            
            # Sort both lists for comparison
            if isinstance(correct_answers, list) and isinstance(user_answer, list):
                return sorted(correct_answers) == sorted(user_answer)
            return False
        except:
            return False
            
    elif q_type == "SAQ":
        # For short answer, use keyword matching
        # This is simplified - in real app you'd want more sophisticated text matching
        expected_answer = question.get("expected_answer", "").lower()
        user_answer_text = str(user_answer).lower()
        
        # Check if key keywords from expected answer are in user answer
        keywords = [word for word in expected_answer.split() if len(word) > 3]
        matches = sum(1 for keyword in keywords if keyword in user_answer_text)
        
        # Consider correct if at least 50% of keywords match
        return matches >= max(1, len(keywords) // 2)
    
    return False

if __name__ == "__main__":
    app.run(debug=True)