#!/usr/bin/env python3
"""
Model Setup Script
Downloads and caches ML models to avoid runtime downloads
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_sentence_transformer():
    """Download and cache SentenceTransformer model"""
    try:
        logger.info("Setting up SentenceTransformer model...")
        from sentence_transformers import SentenceTransformer
        
        # This will download and cache the model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✓ SentenceTransformer model downloaded and cached successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to setup SentenceTransformer: {e}")
        return False

def setup_nltk_data():
    """Download required NLTK data"""
    try:
        logger.info("Setting up NLTK data...")
        import nltk
        
        # Download required NLTK data
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        
        logger.info("✓ NLTK data downloaded successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to setup NLTK data: {e}")
        return False

def setup_languagetool():
    """Setup LanguageTool for grammar checking"""
    try:
        logger.info("Setting up LanguageTool...")
        # Import and test the grammar checker
        from processing.grammar_checker import get_grammar_tool
        
        # Initialize LanguageTool (this will download if needed)
        tool = get_grammar_tool('en-US')
        if tool is None:
            raise Exception("LanguageTool failed to initialize")
        
        # Test with a simple sentence
        test_sentence = "This are a test."
        matches = tool.check(test_sentence)
        logger.info(f"LanguageTool test completed - found {len(matches)} issues in test sentence")
        logger.info("✓ LanguageTool setup completed successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to setup LanguageTool: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("="*60)
    logger.info("EXAM GENERATOR - MODEL SETUP")
    logger.info("="*60)
    logger.info("This script will download and cache ML models to avoid")
    logger.info("runtime downloads that may hang in certain environments.")
    logger.info("="*60)
    
    success_count = 0
    total_count = 3
    
    # Setup SentenceTransformer
    if setup_sentence_transformer():
        success_count += 1
    
    # Setup NLTK
    if setup_nltk_data():
        success_count += 1
    
    # Setup LanguageTool
    if setup_languagetool():
        success_count += 1
    
    logger.info("="*60)
    if success_count == total_count:
        logger.info(f"✓ ALL MODELS SETUP SUCCESSFULLY ({success_count}/{total_count})")
        logger.info("The application is now ready to run with full functionality!")
    else:
        logger.warning(f"⚠ PARTIAL SUCCESS ({success_count}/{total_count})")
        logger.warning("Some models failed to setup. The application will work")
        logger.warning("with reduced functionality (no duplicate detection or grammar checking).")
    
    logger.info("="*60)
    
    return success_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)