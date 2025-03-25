import openai
from firebase_config import db
import os
from dotenv import load_dotenv

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
    Generate a multiple-choice question using OpenAI API.
    """

    prompt = f"""
    Generate a unique, {difficulty} difficulty multiple-choice question based on the following topic and provided text:

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}  # To avoid repetition

    Question:
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    question = response["choices"][0]["message"]["content"].strip()

    # Now generate the answer choices for the MCQ
    choices_prompt = f"""
    Generate 4 multiple choice options for the question:

    {question}

    Provide options and indicate the correct one. Format them like:
    A) Option 1
    B) Option 2
    C) Option 3
    D) Option 4
    Correct answer: [letter]
    """
    
    choices_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": choices_prompt}]
    )
    choices = choices_response["choices"][0]["message"]["content"].strip()

    return question, choices


def TrueFalse_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a true/false question using OpenAI API.
    """
    prompt = f"""
    Generate a {difficulty} difficulty true/false question based on the following topic and text:

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}  # To avoid repetition

    Question:
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    question = response["choices"][0]["message"]["content"].strip()

    # Now generate the answer choices for the True/False
    return question, "True or False"


def SelectMultiple_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a select-multiple question using OpenAI API.
    """
    prompt = f"""
    Generate a {difficulty} difficulty select-multiple question based on the following topic and text:

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}  # To avoid repetition

    Question:
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    question = response["choices"][0]["message"]["content"].strip()

    # Now generate the answer choices for Select Multiple
    choices_prompt = f"""
    Generate 4 possible options for this question where more than one answer could be correct:

    {question}

    Provide options. Indicate the correct ones by saying, for example: "Correct answers: A, C".
    Format them like:
    A) Option 1
    B) Option 2
    C) Option 3
    D) Option 4
    """
    
    choices_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": choices_prompt}]
    )
    choices = choices_response["choices"][0]["message"]["content"].strip()

    return question, choices


def ShortAnswer_prompt(topic, text, difficulty, current_question_pull):
    """
    Generate a short-answer question using OpenAI API.
    """
    prompt = f"""
    Generate a {difficulty} difficulty short-answer question based on the following topic and text:

    Topic: {topic}
    Text: {text}
    Previous Questions: {current_question_pull}  # To avoid repetition

    Question:
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    question = response["choices"][0]["message"]["content"].strip()

    return question, None  # No answer choices for short answer


def generate_question(topic, text, question_type, difficulty, current_question_pull):
    """
    Generate multiple questions based on the topic, text, question type, and difficulty.
    Calls the appropriate prompt function for each question type.
    """
    question_data = []

    # Generate multiple questions
    for _ in range(3):  # Generate 3 questions per call (adjust as needed)
        if question_type == "MCQ":
            question, choices = MCQ_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "TrueFalse":
            question, choices = TrueFalse_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "SelectMultiple":
            question, choices = SelectMultiple_prompt(topic, text, difficulty, current_question_pull)
        elif question_type == "Short":
            question, choices = ShortAnswer_prompt(topic, text, difficulty, current_question_pull)
        else:
            continue

        question_data.append({
            "question": question,
            "choices": choices,
            "type": question_type,
            "difficulty": difficulty
        })
    
    return question_data

def generate_test(user, topics, test_length, difficulty, question_types):
    """
    Create a test by generating questions for the selected topics.
    """
    test = {"user": user, "questions": []}
    num_questions = {"Short": 5, "Medium": 10, "Long": 15}.get(test_length, 10)

    for topic in topics:
        text = fetch_topic_text(topic, topics[topic])
        if not text:
            continue  # Skip if no text found

        for _ in range(num_questions // len(topics)):  # Distribute questions across topics
            for q_type in question_types:
                question = generate_question(topic, text, q_type, difficulty)
                test["questions"].append({
                    "topic": topic,
                    "question": question,
                    "type": q_type,
                    "difficulty": difficulty
                })

    return test
