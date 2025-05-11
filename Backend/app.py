from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import firebase_admin
from processing import process_pdf
from firebase_config import db
from firebase_admin import firestore, auth, credentials
from testgenerator import generate_test
from datetime import datetime


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
    topic_data = process_pdf(file_path)

    # Store topics under the user instead of files
    user_doc_ref = db.collection("users").document(uid)

    topics_list = [
        {
            "topic": topic,
            "text": data["text"]
        }
        for topic, data in topic_data.items()
    ]

    # Add the topics to the user document
    #May need i dont know
    #
    user_doc_ref.set({
        "topics": topics_list
    }, merge=True)

    # Fetch the file document with its topics and timestamp
    print("Hello")
   
    

    # Return both the processed topic_data and the file data from Firebase
    return jsonify({
        "message": "File processed successfully",
        "topics": topic_data,  # Return the topics from PDF processing
    })


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
    test_doc_ref = db.collection("tests")
    if test_id:
        test = test_doc_ref.document(test_id).get()
        test_dict = test.to_dict()

        if question_number:
            question_to_send = test_dict["questions"][question_number]
            
            return jsonify({"question": question_to_send, "test_length": len(test_dict["questions"]), "test_name": test_dict["name"]}), 200
        else:
            uid = test_dict["user"]
            user_ref = db.collection("users").document(uid)
            user = user_ref.get()
            user_dict = user.to_dict()
            del test_dict["user"]
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


        tests = test_doc_ref.get()
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

    
    tests = test_doc_ref.get()
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


### Test Grader ###
@app.route("/submit-test", methods=["POST"])
def submit_test_route():
    data = request.json
    user = data.get("user")  # UID
    test_id = data.get("test_id")  # ID of the original test
    user_answers = data.get("answers")  # Dictionary: {1: 2, 2: "1--3", 3: 0, 4: "their short answer"}

    if not all([user, test_id, user_answers]):
        return jsonify({"error": "Missing required fields"}), 400

    # Load the original test
    test_doc = db.collection("tests").document(test_id).get()
    if not test_doc.exists:
        return jsonify({"error": "Test not found"}), 404

    test_data = test_doc.to_dict()

    # Now call the submit_test function
    from submittest import submit_test
    submitted_test, score = submit_test(user, test_id, test_data, user_answers)

    try:
        _, submission_ref = db.collection("submitted_tests").add(submitted_test)

        return jsonify({
            "message": "Test submitted successfully",
            "submission_id": submission_ref.id,
            "score": score,
            "submitted_test": submitted_test
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)