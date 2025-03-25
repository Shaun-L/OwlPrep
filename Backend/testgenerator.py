import openai
from firebase_config import db
import os
from dotenv import load_dotenv
# Extract the JSON r
import json

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

def fetch_topic_text(topic_name, user):
    """
    Fetch the topic text from Firestore based on the topic name and user.
    """
    user_doc = db.collection("users").document(user).get()
    if not user_doc.exists:
        return None

    user_data = user_doc.to_dict()
    topics = user_data.get("topics", [])
    
    for topic in topics:
        if topic["topic"] == topic_name:
            return topic["text"]
    
    return None

import openai

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

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    # Extract and parse JSON response
    try:
        result = json.loads(response["choices"][0]["message"]["content"].strip())
        return {
            "question": result["question"],
            "options": result["options"],
            "answer": result["answer"]  # Correct answer index
        }
    except json.JSONDecodeError:
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

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    
    try:
        result = json.loads(response["choices"][0]["message"]["content"].strip())
        question = result["question"]
        answer_str = result["answer"]
        answer_index = 0 if answer_str.lower() == "true" else 1  # Convert "True"/"False" to index

        return {
            "question": question,
            "options": ["True", "False"],  # Standard options
            "answer": answer_index  # Index of correct answer
        }

    except json.JSONDecodeError:
        raise ValueError("Failed to parse JSON response from OpenAI.")

import json
import openai

def SelectMultiple_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a select-multiple question using OpenAI API with structured output.
    """
    prompt = f"""
    Generate a unique, {difficulty}-difficulty select-multiple question based on the following topic and text. 
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
        "answers": [0, 2]  # Indices of the correct answers (zero-based)
    }}
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    # Extract and parse JSON response
    try:
        result = json.loads(response["choices"][0]["message"]["content"].strip())
        return {
            "question": result["question"],
            "options": result["options"],
            "answers": result["answers"]  # List of correct answer indices
        }
    except json.JSONDecodeError:
        raise ValueError("Failed to parse JSON response from OpenAI.")



import json
import openai

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

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    # Extract and parse JSON response
    try:
        result = json.loads(response["choices"][0]["message"]["content"].strip())
        return {
            "question": result["question"],
            "expected_answer": result["expected_answer"]  # A description of what the response should include
        }
    except json.JSONDecodeError:
        raise ValueError("Failed to parse JSON response from OpenAI.")


def generate_question(topic, text, question_type, difficulty, current_question_pull):
    """
    Generate multiple questions based on the topic, text, question type, and difficulty.
    Calls the appropriate prompt function for each question type.
    """
    question_data = []

    for _ in range(3):  # Generate 3 questions per call (adjust as needed)
        if question_type == "MCQ":
            result = MCQ_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "TrueFalse":
            result = TrueFalse_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "SelectMultiple":
            result = SelectMultiple_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "Short":
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
    test = {"user": user, "questions": {}}  # Store questions as a dictionary
    num_questions = {"Short": 5, "Medium": 10, "Long": 15}.get(test_length, 10)

    question_number = 1  # Track question numbers
    current_question_pull = []  # Maintain a list of already generated questions

    for topic in topics:
        text = fetch_topic_text(topic, user)
        if not text:
            continue  # Skip if no text found

        for _ in range(num_questions // len(topics)):  # Distribute questions across topics
            for q_type in question_types:
                question_data = generate_question(topic, text, q_type, difficulty, current_question_pull)

                for q in question_data:  # Iterate through generated questions
                    test["questions"][str(question_number)] = {
                        "question": q["question"],
                        "options": q["choices"],
                        "answer": q["answer"],
                        "type": q["type"],
                        "difficulty": q["difficulty"]
                    }
                    current_question_pull.append(q["question"])  # Avoid duplicates
                    question_number += 1  # Increment question number

    return test
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