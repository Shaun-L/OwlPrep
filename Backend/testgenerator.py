import openai
from firebase_config import db
import os
from dotenv import load_dotenv
# Extract the JSON r
import json
import logging
from processing import client

# Configure logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

def fetch_topic_text(topic_name, user):
    """
    Fetch the topic text from Firestore based on the topic name, looking in the user's document.
    """
    logging.debug(f"Fetching topic text for: {topic_name} | User: {user}")

    user_doc_ref = db.collection("users").document(user)
    user_doc = user_doc_ref.get()

    if not user_doc.exists:
        logging.warning(f"User {user} not found in Firestore.")
        return None  # Return None if user does not exist

    user_data = user_doc.to_dict()
    topics = user_data.get("topics", [])

    for topic in topics:
        if topic["topic"] == topic_name:
            logging.debug(f"Found text for topic: {topic_name} under user: {user}")
            return topic["text"]  # Return the matching topic's text

    logging.warning(f"Topic {topic_name} not found for user {user}.")
    return None  # Return None if topic is not found



def MCQ_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a multiple-choice question using OpenAI API with structured output.
    """
    prompt = f"""
    Generate a unique, {difficulty}-difficulty multiple-choice question based on the following topic and text. 
    Avoid repeating previous questions.

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}

    Return the response in **strict JSON format** with the following structure:
    {{
        "question": "The generated multiple-choice question as a string.",
        "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
        ],
        "answer": 2  # Index of the correct answer (zero-based)
    }}
    """
    print("Requesting question...")

    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an AI that strictly outputs JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )

    print("Response received.")

    # Extract and clean the content
    content = chat_completion.choices[0].message.content.strip()

    # Clean up any unwanted characters like backticks or extra quotations
    content = content.replace("```json", "").replace("```", "").strip()


    try:
        if not content:
            raise ValueError("Received empty response from OpenAI API.")

        # Attempt to parse the cleaned response as JSON
        try:
            result = json.loads(content)
        except json.JSONDecodeError as e:
            print("Error: Unable to parse the response as JSON.")
            print("Raw response:", content)
            raise e

        # Validate required fields in the parsed JSON
        if not all(k in result for k in ["question", "options", "answer"]):
            raise ValueError("Invalid JSON structure in OpenAI response.")

        return {
            "question": result["question"],
            "options": result["options"],
            "answer": result["answer"]  # Correct answer index
        }

    except (json.JSONDecodeError, ValueError) as e:
        print("Error parsing OpenAI response:", e)
        print("Raw response:", content)
        raise ValueError("Failed to parse JSON response from OpenAI.")
def TrueFalse_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a unique true/false question using OpenAI API with structured output.
    """
    prompt = f"""
    Generate a unique, {difficulty}-difficulty true/false question based on the following topic and text. 
    Avoid repeating previous questions.

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}

    Return the response in **strict JSON format** with the following structure:
    {{
        "question": "The generated true/false question as a string.",
        "answer": "True or False"  # The correct answer as a string
    }}
    """

    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an AI that strictly outputs JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )

    try:
        if not chat_completion.choices:
            raise ValueError("No choices returned from OpenAI API.")

        content = chat_completion.choices[0].message.content.strip()
        if not content:
            raise ValueError("Received empty response from OpenAI API.")

        # Clean up any unwanted characters like backticks or extra quotations
        content = content.replace("```json", "").replace("```", "").strip()

        result = json.loads(content)

        # Validate required fields
        if "question" not in result or "answer" not in result:
            raise ValueError("Invalid JSON structure in OpenAI response.")

        answer_text = result["answer"].strip().lower()
        if answer_text not in ["true", "false"]:
            raise ValueError("Invalid answer format in OpenAI response.")

        answer_index = 0 if answer_text == "true" else 1

        return {
            "question": result["question"],
            "options": ["True", "False"],
            "answer": answer_index  # 0 for True, 1 for False
        }

    except (json.JSONDecodeError, ValueError) as e:
        print("Error parsing OpenAI response:", e)
        print("Raw response:", chat_completion.choices[0].message.content.strip())
        raise ValueError("Failed to parse JSON response from OpenAI.")


def SelectMultiple_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a select-many question using OpenAI API with structured output.
    """
    prompt = f"""
    Generate a unique, {difficulty}-difficulty select-many question based on the following topic and text. 
    Avoid repeating previous questions.

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}

    Return the response in **strict JSON format** with the following structure:
    {{
        "question": "The generated select-multiple question as a string.",
        "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
        ],
        "answers": [0, 2]  # List of Indices of the correct answers (zero-based)
    }}
    """
    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an AI that strictly outputs JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )

    try:
        if not chat_completion.choices:
            raise ValueError("No choices returned from OpenAI API.")

        content = chat_completion.choices[0].message.content.strip()
        if not content:
            raise ValueError("Received empty response from OpenAI API.")

        # Clean up any unwanted characters like backticks or extra quotations
        content = content.replace("```json", "").replace("```", "").strip()

        print(content)

        result = json.loads(content)

        # Validate required fields
        if "question" not in result or "options" not in result or "answers" not in result:
            raise ValueError("Invalid JSON structure in OpenAI response.")

        return {
            "question": result["question"],
            "options": result["options"],
            "answer": result["answers"]  # List of correct answer indices
        }

    except (json.JSONDecodeError, ValueError) as e:
        print("Error parsing OpenAI response:", e)
        print("Raw response:", chat_completion.choices[0].message.content.strip())
        raise ValueError("Failed to parse JSON response from OpenAI.")

def ShortAnswer_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a short-answer question using OpenAI API with an expected answer description.
    """
    prompt = f"""
    Generate a unique, {difficulty}-difficulty short-answer question based on the following topic and text. 
    Avoid repeating previous questions.

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}

    Return the response in **strict JSON format** with the following structure:
    {{
        "question": "The generated short-answer question as a string.",
        "expected_answer": "A brief description of what a correct response should generally include."
    }}
    """
    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an AI that strictly outputs JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )

    try:
        if not chat_completion.choices:
            raise ValueError("No choices returned from OpenAI API.")

        content = chat_completion.choices[0].message.content.strip()
        if not content:
            raise ValueError("Received empty response from OpenAI API.")

        # Clean up any unwanted characters like backticks or extra quotations
        content = content.replace("```json", "").replace("```", "").strip()

        result = json.loads(content)

        # Validate required fields
        if "question" not in result or "expected_answer" not in result:
            raise ValueError("Invalid JSON structure in OpenAI response.")

        return {
            "question": result["question"],
            "expected_answer": result["expected_answer"]
        }

    except (json.JSONDecodeError, ValueError) as e:
        print("Error parsing OpenAI response:", e)
        print("Raw response:", chat_completion.choices[0].message.content.strip())
        raise ValueError("Failed to parse JSON response from OpenAI.")


def generate_question(topic, text, question_type, difficulty, current_question_pull):
    """
    Generate multiple questions based on the topic, text, question type, and difficulty.
    Calls the appropriate prompt function for each question type.
    """
    question_data = []

    K = 1

    for _ in range(K):  # Generate K questions per call (adjust as needed)
        if question_type == "MCQ":
            result = MCQ_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "T/F":
            result = TrueFalse_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "SMQ":
            result = SelectMultiple_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "SAQ":
            result = ShortAnswer_prompt(topic, text, difficulty, current_question_pull)
        else:
            continue

        question_data.append({
            "question": result["question"],
            "choices": result.get("options", []),  # MCQ/TF/SelectMultiple have options, Short Answer does not
            "answer": result.get("answer", result.get("expected_answer", "")),  # Handle expected_answer for short-answer
            "type": question_type,
            "difficulty": difficulty
        })
    
    return question_data


def generate_test(user, topics, test_length, difficulty, question_types):
    """
    Create a test by generating questions for the selected topics.
    """
    logging.info(f"Generating test for user: {user} | Topics: {topics} | Test Length: {test_length} | Difficulty: {difficulty} | Question Types: {question_types}")

    test = {"questions": {}}  # Store questions as a dictionary
    num_questions = {"Short": 5, "Medium": 10, "Long": 15}.get(test_length, 10)

    question_number = 1  # Track question numbers
    current_question_pull = []  # Maintain a list of already generated questions

    for topic in topics:
        logging.debug(f"Fetching text for topic: {topic}")
        text = fetch_topic_text(topic, user)  # Fetch topic text from Firestore

        if not text:
            logging.warning(f"No text found for topic: {topic} (Skipping)")
            continue  # Skip if no text found

        num_questions_per_topic = num_questions // len(topics)
        logging.debug(f"Generating {num_questions_per_topic} questions for topic: {topic}")

        for _ in range(num_questions_per_topic):  # Distribute questions across topics
            for q_type in question_types:
                logging.debug(f"Generating {q_type} question for topic: {topic}")

                question_data = generate_question(topic, text, q_type, difficulty, current_question_pull)
                if not question_data:
                    logging.warning(f"No questions generated for topic: {topic}, type: {q_type}")
                    continue

                for q in question_data:
                    logging.debug(f"Generated Question {question_number}: {q['question']}")

                    test["questions"][str(question_number)] = {
                        "question": q["question"],
                        "options": q["choices"],
                        "answer": q["answer"],
                        "type": q["type"],
                        "difficulty": q["difficulty"]
                    }
                    current_question_pull.append(q["question"])  # Avoid duplicates
                    question_number += 1  # Increment question number

    logging.info(f"Test generation complete. Total questions: {len(test['questions'])}")
    return test["questions"] # I got lazy
"""
Excpected output of test:
test:
{
    "user": "example_user",
    "questions": {
        "1": {
            "question": "What is the capital of France?",
            "options": ["Berlin", "Madrid", "Paris", "Rome"],
            "answer": 2,
            "type": "MCQ",
            "difficulty": "Medium"
        },
        "2": {
            "question": "Is water composed of hydrogen and oxygen?",
            "options": ["True", "False"],
            "answer": 0,
            "type": "TrueFalse",
            "difficulty": "Easy"
        },
        "3": {
            "question": "Select all prime numbers below.",
            "options": ["2", "3", "4", "5"],
            "answer": [0, 1, 3],
            "type": "SelectMultiple",
            "difficulty": "Hard"
        },
        "4": {
            "question": "What is the process by which plants make their food?",
            "options": [],
            "answer": "Photosynthesis",
            "type": "Short",
            "difficulty": "Medium"
        }
    }
}
"""