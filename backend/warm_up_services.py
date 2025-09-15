# backend/warm_up_services.py

"""
Warm up script to pre-load heavy services like LanguageTool
Run this after backend starts to avoid slow first requests
"""

import logging
from processing.grammar_checker import get_grammar_tool

def warm_up_grammar_checker():
    """Pre-load LanguageTool to avoid downloading on first use."""
    try:
        logging.info("Warming up LanguageTool...")
        tool = get_grammar_tool('en-US')
        if tool:
            # Test with a simple sentence to fully initialize
            test_result = tool.check("This is a test sentence.")
            logging.info(f"LanguageTool warmed up successfully. Test found {len(test_result)} issues.")
        else:
            logging.warning("LanguageTool failed to initialize during warm-up.")
    except Exception as e:
        logging.error(f"Error during LanguageTool warm-up: {str(e)}")

def warm_up_all_services():
    """Warm up all heavy services."""
    logging.info("Starting service warm-up...")
    warm_up_grammar_checker()
    logging.info("Service warm-up complete!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    warm_up_all_services()