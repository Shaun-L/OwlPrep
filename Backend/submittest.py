import openai
from processing import client  # your OpenAI client
from firebase_config import db
import os
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

def grade_question_with_openai(original_question, user_response, question_type):
    """
    Uses OpenAI to grade and explain the question.
    """
    if question_type in ["SAQ", "SMQ"]:
        prompt = f"""
You are grading a {question_type} exam question.

Question: {original_question['question']}
Options: {original_question.get('options', [])}
Correct Answer: {original_question['answer']}
Student's Answer: {user_response}

Grade the response:
- Assign a score out of the total points possible.
- Provide a short explanation formatted as if you are talking to the student.
Return in strict JSON format:
{{
    "score_awarded": (numeric score out of total points),
    "explanation": "Short explanation."
}}
"""
    else:
        prompt = f"""
You are grading a {question_type} exam question.

Question: {original_question['question']}
Options: {original_question.get('options', [])}
Correct Answer: {original_question['answer']}
Student's Answer: {user_response}

Grade the response:
- State if it is Correct or Incorrect.
- Explain why the correct answer is correct.
- If the student's answer is wrong, explain why the wrong answer is wrong.
- The explanation should be formatted as if you are talking to the student.
Return in strict JSON with:
{{
    "result": "Correct" or "Incorrect",
    "explanation": "Explanation text"
}}
"""

    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You strictly output JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = chat_completion.choices[0].message.content.strip()
    content = content.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        raise ValueError("Failed to parse grading response.")

def recommend_resource_for_topic(topic_name):
    """
    Uses OpenAI to suggest an online resource for the given topic.
    """
    prompt = f"""
You are an educational assistant. Recommend a highly reputable online learning resource (like an article, video, or course) that explains the topic: "{topic_name}".
Respond in strict JSON format:
{{
    "resource_name": "Resource title",
    "resource_url": "Direct link to the resource (if known or generic link to trusted platforms like Khan Academy, Coursera, etc.)"
}}
"""
    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "Only output JSON responses."},
                  {"role": "user", "content": prompt}],
        temperature=0.2,
    )

    content = chat_completion.choices[0].message.content.strip()
    content = content.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        raise ValueError("Failed to parse resource recommendation response.")

def submit_test(user, test_id, test_data, user_answers):
    """
    Grades the submitted test, adds parent file names, and recommends resources.
    """
    submitted_test = {
        "user": user,
        "original_test_id": test_id,
        "test_name": test_data.get("test_name", ""),
        "test_description": test_data.get("test_description", ""),
        "questions": {},
        "score_percentage": 0,
        "points_earned": 0,
        "points_possible": 0,
    }

    points_map = {
        "T/F": 5,
        "MCQ": 10,
        "SMQ": 10,
        "SAQ": 15
    }

    total_points_earned = 0
    total_points_possible = 0

    for q_num, question in test_data["questions"].items():
        user_response = user_answers.get(int(q_num), None)

        if user_response is None:
            continue  # Skipped question

        question_type = question.get("type", "MCQ")
        question_topic = question.get("topic", "General Topic")
        parent_file = question.get("parent_file", "Unknown File")  # NEW - fetch parent file name

        # Special handling for SelectMultiple
        if question_type == "SMQ" and isinstance(user_response, str):
            user_response = list(map(int, user_response.split("~~")))

        question_points = points_map.get(question_type, 10)
        total_points_possible += question_points

        # Grade question
        grading_result = grade_question_with_openai(question, user_response, question_type)

        if question_type in ["SMQ", "SAQ"]:
            points_awarded = grading_result.get("score_awarded", 0)
            explanation = grading_result.get("explanation", "")
        else:
            result = grading_result.get("result", "Incorrect")
            explanation = grading_result.get("explanation", "")
            points_awarded = question_points if result.lower() == "correct" else 0

        total_points_earned += points_awarded

        # Recommend a resource
        resource_recommendation = recommend_resource_for_topic(question_topic)

        submitted_test["questions"][q_num] = {
            "original_question": question,
            "user_answer": user_response,
            "points_awarded": points_awarded,
            "points_possible": question_points,
            "explanation": explanation,
            "parent_file": parent_file,
            "resource_recommendation": resource_recommendation
        }

    if total_points_possible == 0:
        score_percentage = 0
    else:
        score_percentage = round((total_points_earned / total_points_possible) * 100, 2)

    submitted_test["score_percentage"] = score_percentage
    submitted_test["points_earned"] = total_points_earned
    submitted_test["points_possible"] = total_points_possible

    return submitted_test, score_percentage, total_points_earned, total_points_possible
