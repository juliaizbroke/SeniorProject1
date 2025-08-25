# backend/setup_nlp.py

"""
Setup script for NLP models and data required for duplicate detection.
Run this script once after installing the requirements to download necessary models.
"""

import nltk
import ssl
from sentence_transformers import SentenceTransformer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_nltk():
    """Download required NLTK data"""
    try:
        # Handle SSL certificate issues on some systems
        try:
            _create_unverified_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        else:
            ssl._create_default_https_context = _create_unverified_https_context
        
        logger.info("Downloading NLTK data...")
        
        # Download required NLTK resources
        nltk_downloads = [
            'punkt',      # Sentence tokenization
            'stopwords',  # Stop words for multiple languages
            'wordnet',    # WordNet lemmatizer
            'averaged_perceptron_tagger',  # POS tagger
            'omw-1.4'     # Open Multilingual Wordnet
        ]
        
        for resource in nltk_downloads:
            try:
                logger.info(f"Downloading {resource}...")
                nltk.download(resource, quiet=False)
            except Exception as e:
                logger.error(f"Failed to download {resource}: {e}")
        
        logger.info("NLTK setup completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error setting up NLTK: {e}")
        return False

def setup_sentence_transformers():
    """Download and cache the sentence transformer model"""
    try:
        logger.info("Downloading sentence transformer model...")
        
        # This will download and cache the model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Sentence transformer model downloaded successfully!")
        
        # Test the model with a simple example
        test_sentences = [
            "What is machine learning?",
            "Define machine learning."
        ]
        
        embeddings = model.encode(test_sentences)
        logger.info(f"Model test successful! Generated embeddings with shape: {embeddings.shape}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error setting up sentence transformers: {e}")
        return False

def test_duplicate_detector():
    """Test the duplicate detector functionality"""
    try:
        logger.info("Testing duplicate detector...")
        
        # Import after models are set up
        from processing.duplicate_detector import QuestionDuplicateDetector
        
        detector = QuestionDuplicateDetector()
        
        # Test with sample questions
        test_questions = [
            {
                "type": "multiple choice",
                "question": "What is the capital of France?",
                "a": "London", "b": "Berlin", "c": "Paris", "d": "Madrid", "e": "",
                "answer": "c", "category": "Geography"
            },
            {
                "type": "multiple choice", 
                "question": "What is the capital city of France?",
                "a": "Rome", "b": "Paris", "c": "Madrid", "d": "Berlin", "e": "",
                "answer": "b", "category": "Geography"
            },
            {
                "type": "true/false",
                "question": "Python is a programming language.",
                "answer": "True", "category": "Computer Science"
            }
        ]
        
        # Test similarity calculation
        similarity = detector.calculate_similarity(test_questions[0], test_questions[1])
        logger.info(f"Similarity between similar questions: {similarity:.3f}")
        
        # Test duplicate removal
        filtered_questions, removed = detector.remove_duplicates(test_questions)
        logger.info(f"Original: {len(test_questions)} questions, After filtering: {len(filtered_questions)} questions")
        logger.info(f"Removed {len(removed)} duplicates")
        
        logger.info("Duplicate detector test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error testing duplicate detector: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("Starting NLP setup for duplicate detection...")
    
    success = True
    
    # Setup NLTK
    if not setup_nltk():
        success = False
    
    # Setup Sentence Transformers
    if not setup_sentence_transformers():
        success = False
    
    # Test the duplicate detector
    if not test_duplicate_detector():
        success = False
    
    if success:
        logger.info("✅ All NLP components set up successfully!")
        logger.info("The duplicate detection system is ready to use.")
    else:
        logger.error("❌ Some components failed to set up. Check the logs above.")
    
    return success

if __name__ == "__main__":
    main()
