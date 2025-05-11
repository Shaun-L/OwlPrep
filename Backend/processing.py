import openai
import PyPDF2
import os
import re
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

def chunk_text(text, max_chunk_size=30000):
    """Split text into chunks to avoid token limit issues."""
    # Split by paragraphs first
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph would exceed max_chunk_size
        if len(current_chunk) + len(paragraph) > max_chunk_size:
            # If current chunk is not empty, add it to chunks
            if current_chunk:
                chunks.append(current_chunk)
            
            # If paragraph itself is longer than max_chunk_size, split it further
            if len(paragraph) > max_chunk_size:
                # Split paragraph into sentences (rough approximation)
                sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                current_chunk = ""
                
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) > max_chunk_size:
                        chunks.append(current_chunk)
                        current_chunk = sentence + " "
                    else:
                        current_chunk += sentence + " "
            else:
                current_chunk = paragraph + "\n\n"
        else:
            current_chunk += paragraph + "\n\n"
    
    # Add the last chunk if it's not empty
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

def extract_topics_with_openai(text):
    # Chunk the text to avoid token limit issues
    text_chunks = chunk_text(text)
    all_topics = []
    
    for i, chunk in enumerate(text_chunks):
        # Adjust the prompt for chunked text
        prompt = f"""
        Identify the main topics covered in the following section ({i+1}/{len(text_chunks)}) of the notes and list them as bullet points.
        Topics should be specific concepts like "Linear Regression," "Logistic Regression," or "Gradient Descent."
        Keep topics concise and clear.

        Text:
        {chunk}

        Return only a bullet-point list of topics.
        """

        try:
            chat_completion = client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use 3.5-turbo instead of gpt-4o for the initial topic extraction
                messages=[{"role": "system", "content": "Extract topics from text."},
                        {"role": "user", "content": prompt}],
                temperature=0.7,
            )
            response_text = chat_completion.choices[0].message.content
            chunk_topics = [line.strip("-•* ") for line in response_text.split("\n") if line.strip()]
            all_topics.extend(chunk_topics)
        except Exception as e:
            print(f"Error extracting topics from chunk {i+1}: {e}")
    
    # Consolidate and deduplicate topics
    if all_topics:
        # Use GPT to consolidate the topics if there are too many
        if len(all_topics) > 5:
            try:
                consolidation_prompt = f"""
                Consolidate and generalize these topics into 3-5 main topics:
                {', '.join(all_topics)}
                
                Return only a bullet-point list of consolidated topics.
                """
                
                chat_completion = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "system", "content": "Consolidate topics."},
                            {"role": "user", "content": consolidation_prompt}],
                    temperature=0.5,
                )
                response_text = chat_completion.choices[0].message.content
                consolidated_topics = [line.strip("-•* ") for line in response_text.split("\n") if line.strip()]
                return consolidated_topics[:5]  # Return at most 5 topics
            except Exception as e:
                print(f"Error consolidating topics: {e}")
                return list(set(all_topics))[:5]  # Fallback: just return deduplicated topics
        else:
            return list(set(all_topics))  # Deduplicate topics
    
    return []

def extract_relevant_text_with_openai(text, topics):
    # Chunk the text to avoid token limit issues
    text_chunks = chunk_text(text)
    topic_text_mapping = {}
    
    for topic in topics:
        relevant_passages = []
        
        for i, chunk in enumerate(text_chunks):
            prompt = f"""
            Extract relevant passages related to "{topic}" from the following section ({i+1}/{len(text_chunks)}) of the text.
            If this section doesn't contain information about "{topic}", just respond with "No relevant information in this section."
            Provide 1-2 sentences that discuss the topic.

            Text:
            {chunk}

            Return only the extracted text.
            """

            try:
                chat_completion = client.chat.completions.create(
                    model="gpt-3.5-turbo",  # Use 3.5-turbo for faster processing and lower token count
                    messages=[{"role": "system", "content": "Extract relevant text."},
                            {"role": "user", "content": prompt}],
                    temperature=0,
                )
                relevant_text = chat_completion.choices[0].message.content.strip()
                if relevant_text and "No relevant information" not in relevant_text:
                    relevant_passages.append(relevant_text)
            except Exception as e:
                print(f"Error extracting text for '{topic}' from chunk {i+1}: {e}")
        
        # Combine all relevant passages for this topic
        if relevant_passages:
            joined_text = " ".join(relevant_passages)
            # Limit the text to avoid very long entries
            if len(joined_text) > 2000:
                try:
                    summary_prompt = f"""
                    Summarize this text about {topic} in 3-5 sentences:
                    {joined_text}
                    """
                    
                    chat_completion = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "system", "content": "Summarize text."},
                                {"role": "user", "content": summary_prompt}],
                        temperature=0.3,
                    )
                    joined_text = chat_completion.choices[0].message.content.strip()
                except Exception as e:
                    print(f"Error summarizing text for '{topic}': {e}")
                    # Fallback: truncate the text
                    joined_text = joined_text[:2000] + "..."
            
            topic_text_mapping[topic] = {"text": joined_text, "files": []}
    
    return topic_text_mapping

def process_pdf(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return {}

    topics = extract_topics_with_openai(text)
    topic_text_mapping = extract_relevant_text_with_openai(text, topics)

    fileName = re.sub(r'(?<!_)_(?!_)', ' ', os.path.basename(pdf_path))
    # Replace sequences of two or more underscores with one fewer
    fileName = re.sub(r'(_{2,})', lambda match: '_' * (len(match.group(0)) - 1), fileName)

    for topic in topic_text_mapping:
        topic_text_mapping[topic]["files"].append(fileName)

    return topic_text_mapping
