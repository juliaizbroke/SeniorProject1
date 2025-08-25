# backend/test_duplicate_detection.py

"""
Test script for duplicate detection functionality.
This script tests the duplicate detection system with sample data.
"""

import json
import logging
from processing.duplicate_detector import QuestionDuplicateDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample test questions with various types of duplicates
test_questions = [
    # Exact duplicates
    {
        "type": "multiple choice",
        "question": "What is the capital of France?",
        "a": "London", "b": "Berlin", "c": "Paris", "d": "Madrid", "e": "",
        "answer": "c", "category": "Geography"
    },
    {
        "type": "multiple choice", 
        "question": "What is the capital of France?",
        "a": "Rome", "b": "Paris", "c": "Madrid", "d": "Berlin", "e": "",
        "answer": "b", "category": "Geography"
    },
    
    # Similar questions (paraphrased)
    {
        "type": "multiple choice",
        "question": "What is the capital city of France?",
        "a": "London", "b": "Berlin", "c": "Paris", "d": "Madrid", "e": "",
        "answer": "c", "category": "Geography"
    },
    {
        "type": "multiple choice",
        "question": "Which city is the capital of France?",
        "a": "Paris", "b": "London", "c": "Berlin", "d": "Madrid", "e": "",
        "answer": "a", "category": "Geography"
    },
    
    # Unique questions
    {
        "type": "multiple choice",
        "question": "What is the capital of Germany?",
        "a": "Munich", "b": "Hamburg", "c": "Berlin", "d": "Frankfurt", "e": "",
        "answer": "c", "category": "Geography"
    },
    {
        "type": "true/false",
        "question": "Python is a programming language.",
        "answer": "True", "category": "Computer Science"
    },
    {
        "type": "true/false",
        "question": "Java is a programming language.",
        "answer": "True", "category": "Computer Science"
    },
    
    # Nearly identical with small variations
    {
        "type": "written question",
        "question": "Explain the concept of machine learning.",
        "answer": "Machine learning is a subset of AI that enables computers to learn without explicit programming.",
        "q_type": "short", "category": "AI"
    },
    {
        "type": "written question",
        "question": "Explain machine learning concept.",
        "answer": "ML is a part of AI that allows systems to learn automatically.",
        "q_type": "short", "category": "AI"
    }
]

def test_similarity_calculation():
    """Test similarity calculation between questions"""
    logger.info("Testing similarity calculation...")
    
    detector = QuestionDuplicateDetector(similarity_threshold=0.8)
    
    # Test exact match
    similarity = detector.calculate_similarity(test_questions[0], test_questions[1])
    logger.info(f"Exact match similarity: {similarity:.3f}")
    
    # Test paraphrased questions
    similarity = detector.calculate_similarity(test_questions[0], test_questions[2])
    logger.info(f"Paraphrased similarity: {similarity:.3f}")
    
    # Test unrelated questions
    similarity = detector.calculate_similarity(test_questions[0], test_questions[5])
    logger.info(f"Unrelated questions similarity: {similarity:.3f}")

def test_duplicate_groups():
    """Test finding duplicate groups"""
    logger.info("\nTesting duplicate group detection...")
    
    detector = QuestionDuplicateDetector(similarity_threshold=0.7)
    duplicate_groups = detector.find_duplicate_groups(test_questions)
    
    logger.info(f"Found {len(duplicate_groups)} groups:")
    for i, group in enumerate(duplicate_groups):
        if len(group) > 1:
            logger.info(f"\nGroup {i+1} ({len(group)} questions):")
            for j, question in enumerate(group):
                logger.info(f"  {j+1}. [{question['type']}] {question['question'][:60]}...")

def test_duplicate_removal():
    """Test removing duplicates"""
    logger.info("\nTesting duplicate removal...")
    
    # Test with different thresholds
    thresholds = [0.6, 0.7, 0.8, 0.9]
    
    for threshold in thresholds:
        detector = QuestionDuplicateDetector(similarity_threshold=threshold)
        filtered_questions, removed_duplicates = detector.remove_duplicates(test_questions.copy())
        
        logger.info(f"Threshold {threshold}: {len(test_questions)} -> {len(filtered_questions)} questions "
                   f"({len(removed_duplicates)} removed)")

def test_different_question_types():
    """Test with different question types"""
    logger.info("\nTesting with different question types...")
    
    mixed_questions = [
        {"type": "multiple choice", "question": "What is AI?", "a": "Artificial Intelligence", "b": "None", "c": "", "d": "", "e": "", "answer": "a", "category": "Tech"},
        {"type": "true/false", "question": "What is AI?", "answer": "Artificial Intelligence", "category": "Tech"},
        {"type": "written question", "question": "What is AI?", "answer": "Artificial Intelligence", "q_type": "short", "category": "Tech"},
        {"type": "matching", "question": "What is AI?", "answer": "Artificial Intelligence", "category": "Tech"}
    ]
    
    detector = QuestionDuplicateDetector(similarity_threshold=0.8)
    filtered_questions, removed_duplicates = detector.remove_duplicates(mixed_questions)
    
    logger.info(f"Mixed question types: {len(mixed_questions)} -> {len(filtered_questions)} questions")
    logger.info(f"Remaining question types: {[q['type'] for q in filtered_questions]}")

def test_edge_cases():
    """Test edge cases"""
    logger.info("\nTesting edge cases...")
    
    detector = QuestionDuplicateDetector()
    
    # Empty list
    result, removed = detector.remove_duplicates([])
    logger.info(f"Empty list: {len(result)} questions, {len(removed)} removed")
    
    # Single question
    result, removed = detector.remove_duplicates([test_questions[0]])
    logger.info(f"Single question: {len(result)} questions, {len(removed)} removed")
    
    # All identical questions
    identical_questions = [test_questions[0]] * 5
    result, removed = detector.remove_duplicates(identical_questions)
    logger.info(f"All identical: {len(identical_questions)} -> {len(result)} questions, {len(removed)} removed")

def main():
    """Run all tests"""
    logger.info("Starting duplicate detection tests...\n")
    
    try:
        test_similarity_calculation()
        test_duplicate_groups()
        test_duplicate_removal()
        test_different_question_types()
        test_edge_cases()
        
        logger.info("\n✅ All tests completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
