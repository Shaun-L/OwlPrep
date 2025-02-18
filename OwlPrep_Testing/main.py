import openai
import PyPDF2
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI(api_key=api_key)

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file.
    """
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
    """
    Uses OpenAI GPT to extract topics from the given text and returns them as a list of strings.
    """
    prompt = f"""
    Identify the main topics covered in the following notes and list them as bullet points. 
    Topics should be specific concepts like "Linear Regression," "Logistic Regression," or "Gradient Descent."
    Make sure topics are suitable for creating a test. Generalize the topics to a maximum of 6.

    Text:
    {text}

    Return only a bullet-point list of topics without any additional text.
    """

    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI that extracts topics from text.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.7,
        )

        response_text = chat_completion.choices[0].message.content

        # Convert response into a list of topics
        topics = [line.strip("-•* ") for line in response_text.split("\n") if line.strip()]

        return topics
    except Exception as e:
        print(f"Error generating response: {e}")
        return []

def extract_relevant_text_with_openai(text, topics):
    """
    Uses OpenAI to extract relevant text chunks for each topic from the given text.
    """
    topic_text_mapping = {}

    for topic in topics:
        prompt = f"""
        Extract relevant passages from the provided text that relate to the topic: "{topic}".
        Provide only the most relevant text snippets (3-5 sentences each) that discuss the topic.
        Ensure the extracted snippets are useful for understanding or testing knowledge on the topic.

        Text:
        {text}

        Return only the extracted text without any additional explanation.
        """

        try:
            chat_completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI that extracts relevant text based on given topics.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.5,
            )

            relevant_text = chat_completion.choices[0].message.content.strip()

            if relevant_text:
                topic_text_mapping[topic] = {
                    "text": relevant_text.split("\n\n"),  # Splitting into snippets
                    "files": [],
                }

        except Exception as e:
            print(f"Error extracting relevant text for '{topic}': {e}")

    return topic_text_mapping

def process_pdf(pdf_path, topic_data):
    """
    Processes a single PDF file: extracts text, finds topics, and associates text chunks with topics.
    """
    file_name = os.path.basename(pdf_path)
    
    # Extract text from the PDF
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print(f"No text extracted from {file_name}.")
        return

    # Extract topics from the text
    topics = extract_topics_with_openai(text)
    print("Extracted Topics:", topics)

    # Extract relevant text chunks for each topic
    topic_text_mapping = extract_relevant_text_with_openai(text, topics)

    # Merge with existing topic data
    for topic, data in topic_text_mapping.items():
        if data["text"]:  # Only store topics that have relevant text
            if topic in topic_data:
                topic_data[topic]["text"].extend(data["text"])
                topic_data[topic]["files"].append(file_name)
            else:
                topic_data[topic] = {
                    "text": data["text"],
                    "files": [file_name]
                }

if __name__ == "__main__":
    pdf_files = [
        "./files/CECS 327 Notes_ Networks and Distributed Computing.pdf",
    ]

    topic_data = {}

    for pdf_path in pdf_files:
        process_pdf(pdf_path, topic_data)

    # Print structured topic data
    print("\nExtracted Topics and Relevant Texts:\n")
    for topic, data in topic_data.items():
        print(f"Topic: {topic}")
        print("Files:", ", ".join(data["files"]))
        print("Relevant Text Snippets:")
        for snippet in data["text"]:
            print(f" - {snippet[:200]}...")  # Print first 200 characters
        print("\n" + "="*50 + "\n")
