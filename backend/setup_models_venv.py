"""
ML Model Setup Script - Virtual Environment Version
This script pre-downloads and caches ML models inside the virtual environment
to prevent runtime hangs during first use.
"""

import os
import sys
import time
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_sentence_transformer():
    """Pre-download and cache SentenceTransformer model"""
    print("[SETUP] Setting up SentenceTransformer model...")
    try:
        from sentence_transformers import SentenceTransformer
        start_time = time.time()
        
        # Load model (this will download and cache it)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Test the model works
        test_embeddings = model.encode(["Test sentence"])
        if len(test_embeddings) > 0:
            elapsed = time.time() - start_time
            print(f"[SETUP] ✓ SentenceTransformer ready ({elapsed:.1f}s)")
            return True
        else:
            print(f"[SETUP] ✗ SentenceTransformer test failed")
            return False
            
    except Exception as e:
        print(f"[SETUP] ✗ SentenceTransformer failed: {e}")
        return False

def setup_languagetool():
    """Pre-download and cache LanguageTool resources"""
    print("[SETUP] Setting up LanguageTool...")
    try:
        import language_tool_python
        start_time = time.time()
        
        # Initialize tool (this will download resources)
        tool = language_tool_python.LanguageTool('en-US')
        
        # Test the tool works
        test_check = tool.check("This is test sentence.")
        tool.close()
        
        elapsed = time.time() - start_time
        print(f"[SETUP] ✓ LanguageTool ready ({elapsed:.1f}s)")
        return True
        
    except Exception as e:
        print(f"[SETUP] ✗ LanguageTool failed: {e}")
        return False

def setup_nltk_data():
    """Pre-download NLTK data"""
    print("[SETUP] Setting up NLTK data...")
    try:
        import nltk
        start_time = time.time()
        
        # Download common NLTK data
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        
        elapsed = time.time() - start_time
        print(f"[SETUP] ✓ NLTK data ready ({elapsed:.1f}s)")
        return True
        
    except Exception as e:
        print(f"[SETUP] ✗ NLTK setup failed: {e}")
        return False

def check_environment():
    """Check if we're in the correct virtual environment"""
    print(f"[SETUP] Python executable: {sys.executable}")
    print(f"[SETUP] Virtual environment: {os.environ.get('VIRTUAL_ENV', 'Not detected')}")
    
    # Check if we're in venv
    if 'venv' in sys.executable.lower() or os.environ.get('VIRTUAL_ENV'):
        print("[SETUP] ✓ Running in virtual environment")
        return True
    else:
        print("[SETUP] ⚠ Not running in virtual environment")
        return False

def main():
    print("=" * 60)
    print("ML Models Setup - Virtual Environment Version")
    print("=" * 60)
    
    start_time = time.time()
    
    # Check environment
    in_venv = check_environment()
    if not in_venv:
        print("[WARNING] Not running in virtual environment - models may not be accessible to Flask app")
    
    # Setup models
    results = {}
    results['sentence_transformer'] = setup_sentence_transformer()
    results['nltk'] = setup_nltk_data() 
    results['languagetool'] = setup_languagetool()
    
    # Summary
    total_time = time.time() - start_time
    successful = sum(results.values())
    total_models = len(results)
    
    print("\n" + "=" * 60)
    print(f"Setup Complete: {successful}/{total_models} models ready ({total_time:.1f}s)")
    print("=" * 60)
    
    if successful == total_models:
        print("✓ All models successfully cached!")
        print("✓ Upload with ML features should work without delays")
        return True
    else:
        print("⚠ Some models failed to setup")
        for model, success in results.items():
            status = "✓" if success else "✗"
            print(f"  {status} {model}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)