import openai
import PyPDF2
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI(api_key=api_key)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def extract_topics_with_openai(text):
    prompt = f"""
    Identify the main topics covered in the following notes and list them as bullet points.
    Topics should be specific concepts like "Linear Regression," "Logistic Regression," or "Gradient Descent."
    Generalize the topics to a maximum of 3.

    Text:
    {text}

    Return only a bullet-point list of topics.
    """

    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Extract topics from text."},
                      {"role": "user", "content": prompt}],
            temperature=0.7,
        )
        response_text = chat_completion.choices[0].message.content
        return [line.strip("-•* ") for line in response_text.split("\n") if line.strip()]
    except Exception as e:
        print(f"Error extracting topics: {e}")
        return []

def extract_relevant_text_with_openai(text, topics):
    topic_text_mapping = {}
    for topic in topics:
        prompt = f"""
        Extract relevant passages related to "{topic}" from the text.
        Provide 3-5 sentences that discuss the topic.

        Text:
        {text}

        Return only the extracted text.
        """

        try:
            chat_completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": "Extract relevant text."},
                          {"role": "user", "content": prompt}],
                temperature=0,
            )
            relevant_text = chat_completion.choices[0].message.content.strip()
            if relevant_text:
                topic_text_mapping[topic] = {"text": relevant_text.split("\n\n"), "files": []}
        except Exception as e:
            print(f"Error extracting text for '{topic}': {e}")

    return topic_text_mapping

def process_pdf(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return {}

    topics = extract_topics_with_openai(text)
    topic_text_mapping = extract_relevant_text_with_openai(text, topics)

    for topic in topic_text_mapping:
        topic_text_mapping[topic]["files"].append(os.path.basename(pdf_path))

    return topic_text_mapping
