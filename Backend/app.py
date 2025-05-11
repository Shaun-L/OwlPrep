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
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

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

@app.route("/progress/track", methods=["GET"])
def get_progress_track():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/progress/update", methods=["POST"])
def update_progress():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/pathway/recommend", methods=["GET"])
def get_pathway_recommend():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/quiz/daily", methods=["GET"])
def get_daily_quiz():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/quiz/submit", methods=["POST"])
def submit_daily_quiz():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/tests/share", methods=["POST"])
def share_test():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/tests/download/:id", methods=["GET"])
def download_test():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

@app.route("/tests/feedback", methods=["POST"])
def submit_test_feedback():
    # Implementation of the endpoint
    return jsonify({"error": "Endpoint not implemented"}), 501

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

if __name__ == "__main__":
    app.run(debug=True)