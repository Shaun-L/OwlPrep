import schedule
import time
import datetime
import threading
import logging
from firebase_config import db
import random
from testgenerator import generate_test

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('daily_quiz_scheduler.log')
    ]
)

logger = logging.getLogger(__name__)

def generate_daily_quizzes():
    """
    Generate new daily quizzes for all users
    """
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    logger.info(f"Starting daily quiz generation for {today}")
    
    # Get all users
    users_ref = db.collection("users")
    users = users_ref.stream()
    
    quiz_count = 0
    skip_count = 0
    
    for user in users:
        uid = user.id
        user_data = user.to_dict()
        
        # Check if user already has a quiz for today
        existing_quiz = db.collection("tests").where("user", "==", uid).where("type", "==", "Daily Quiz").where("date", "==", today).get()
        if len(existing_quiz) > 0:
            logger.info(f"User {uid} already has a daily quiz for today, skipping")
            skip_count += 1
            continue
        
        # Check if user has topics
        user_topics = user_data.get("topics", [])
        if not user_topics or len(user_topics) == 0:
            logger.info(f"Skipping user {uid}: No topics found")
            skip_count += 1
            continue
        
        # Select 3 random topics (or fewer if user has less than 3)
        try:
            num_topics = min(3, len(user_topics))
            selected_topics = random.sample([topic["topic"] for topic in user_topics], num_topics)
            
            # Generate a quiz with 10 questions
            question_types = ["MCQ", "T/F", "SAQ", "SMQ"]
            
            # Use "Short" length to ensure 10 questions
            questions = generate_test(uid, selected_topics, "Short", "Medium", question_types)
            
            # Make sure we have exactly 10 questions
            question_items = list(questions.items())
            if len(question_items) > 10:
                question_items = question_items[:10]
            questions = {k: v for k, v in question_items}
            
            # Create the daily quiz object
            daily_quiz = {
                "user": uid,
                "name": f"Daily Quiz - {today}",
                "description": f"Daily practice quiz with {len(selected_topics)} topic(s): {', '.join(selected_topics)}",
                "difficulty": "Medium",
                "topics": selected_topics,
                "type": "Daily Quiz",
                "question_types": question_types,
                "test_length": "Short",  # Always Short for daily quizzes (10 questions)
                "questions": questions,
                "date": today,
                "created": datetime.datetime.now().strftime("%m/%d/%y"),
                "is_daily": True  # Flag to identify daily quizzes
            }
            
            # Save the generated quiz in the regular tests collection
            quiz_ref, quiz_id = db.collection("tests").add(daily_quiz)
            quiz_count += 1
            logger.info(f"Generated daily quiz for user {uid} with {len(questions)} questions, ID: {quiz_id}")
            
        except Exception as e:
            logger.error(f"Error generating daily quiz for user {uid}: {str(e)}")
            skip_count += 1
    
    logger.info(f"Daily quiz generation complete. Generated: {quiz_count}, Skipped: {skip_count}")

def run_scheduler():
    # Schedule the job to run at midnight every day
    schedule.every().day.at("00:00").do(generate_daily_quizzes)
    
    logger.info("Daily quiz scheduler started")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    # Run the initial generation (for testing)
    generate_daily_quizzes()
    
    # Start the scheduler in a separate thread
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Daily quiz scheduler stopped") 