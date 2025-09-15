# backend/processing/grammar_checker.py

import language_tool_python
import logging
from typing import List, Dict, Any
import os

# Global instance to avoid re-downloading LanguageTool
_grammar_tool_instance = None
_grammar_tool_language = None

def get_grammar_tool(language='en-US'):
    """Get a cached LanguageTool instance to avoid re-downloading."""
    global _grammar_tool_instance, _grammar_tool_language
    
    if _grammar_tool_instance is None or _grammar_tool_language != language:
        logging.info(f"Initializing LanguageTool for language: {language}")
        try:
            # Try to initialize with specific cache directory and config
            cache_dir = os.path.expanduser("~/.cache/language_tool_python")
            os.makedirs(cache_dir, exist_ok=True)
            
            # Initialize with local installation
            _grammar_tool_instance = language_tool_python.LanguageTool(
                language, 
                config={'cacheSize': 1000, 'pipelineCaching': True}
            )
            _grammar_tool_language = language
            logging.info(f"Grammar tool initialized successfully for language: {language}")
        except Exception as e:
            logging.warning(f"Failed to initialize local grammar tool: {str(e)}")
            try:
                # Fallback to public API
                _grammar_tool_instance = language_tool_python.LanguageToolPublicAPI(language)
                _grammar_tool_language = language
                logging.info(f"Grammar tool initialized with public API for language: {language}")
            except Exception as e2:
                logging.error(f"Failed to initialize grammar tool: {str(e2)}")
                _grammar_tool_instance = None
                _grammar_tool_language = None
    
    return _grammar_tool_instance

class GrammarChecker:
    """
    Grammar checker that uses language-tool-python to identify potential grammar errors in questions.
    Does not fix grammar but marks questions with potential issues.
    Uses a cached global instance to avoid re-downloading LanguageTool.
    """
    
    def __init__(self, language='en-US'):
        """
        Initialize the grammar checker.
        
        Args:
            language (str): Language code for the grammar checker (default: 'en-US')
        """
        self.language = language
        self.tool = get_grammar_tool(language)
    
    def check_text(self, text: str) -> Dict[str, Any]:
        """
        Check grammar for a single text string.
        
        Args:
            text (str): Text to check for grammar errors
            
        Returns:
            dict: Grammar check results containing:
                - has_errors (bool): Whether grammar errors were found
                - error_count (int): Number of errors found
                - errors (list): List of error details
        """
        if not self.tool or not text or not isinstance(text, str):
            return {
                'has_errors': False,
                'error_count': 0,
                'errors': []
            }
        
        try:
            # Clean the text (remove extra whitespace)
            clean_text = text.strip()
            if not clean_text:
                return {
                    'has_errors': False,
                    'error_count': 0,
                    'errors': []
                }
            
            # Check for grammar errors
            matches = self.tool.check(clean_text)
            
            # Filter out some common false positives that might not be relevant for exam questions
            filtered_matches = []
            for match in matches:
                # Skip whitespace-only errors
                if match.ruleId in ['WHITESPACE_RULE']:
                    continue
                
                # Skip punctuation at end errors for short phrases (common in multiple choice options)
                if match.ruleId in ['SENTENCE_FRAGMENT'] and len(clean_text.split()) <= 3:
                    continue
                
                filtered_matches.append({
                    'message': match.message,
                    'rule_id': match.ruleId,
                    'category': match.category,
                    'offset': match.offset,
                    'length': match.errorLength,
                    'context': match.context,
                    'suggestions': match.replacements[:3] if match.replacements else []  # Limit to 3 suggestions
                })
            
            return {
                'has_errors': len(filtered_matches) > 0,
                'error_count': len(filtered_matches),
                'errors': filtered_matches
            }
            
        except Exception as e:
            logging.error(f"Error checking grammar for text: {str(e)}")
            return {
                'has_errors': False,
                'error_count': 0,
                'errors': []
            }
    
    def check_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check grammar for a single question object.
        
        Args:
            question (dict): Question object with various fields
            
        Returns:
            dict: Updated question object with grammar check results
        """
        if not self.tool:
            # If grammar checker is not available, return question unchanged
            question['grammar_check'] = {
                'checked': False,
                'error': 'Grammar checker not available'
            }
            question['has_potential_grammar_error'] = False
            question['has_grammar_issues'] = False
            question['grammar_issue_count'] = 0
            question['grammar_issues'] = []
            return question
        
        grammar_results = {
            'checked': True,
            'has_errors': False,
            'total_errors': 0,
            'fields_with_errors': []
        }
        
        # Fields to check based on question type
        fields_to_check = ['question']  # Always check the main question
        
        question_type = question.get('type', '')
        
        if question_type == 'multiple choice':
            fields_to_check.extend(['a', 'b', 'c', 'd', 'e'])
        elif question_type in ['true/false', 'matching', 'written question']:
            fields_to_check.append('answer')  # Check the answer field for these types
        
        # Check each relevant field
        for field in fields_to_check:
            if field in question and question[field]:
                field_result = self.check_text(str(question[field]))
                
                if field_result['has_errors']:
                    grammar_results['has_errors'] = True
                    grammar_results['total_errors'] += field_result['error_count']
                    grammar_results['fields_with_errors'].append({
                        'field': field,
                        'error_count': field_result['error_count'],
                        'errors': field_result['errors']
                    })
        
        # Add grammar check results to the question
        question['grammar_check'] = grammar_results
        
        # Add frontend-compatible flags
        question['has_potential_grammar_error'] = grammar_results['has_errors']
        question['has_grammar_issues'] = grammar_results['has_errors']  # Frontend expects this field
        question['grammar_issue_count'] = grammar_results['total_errors']
        
        # Format grammar issues for frontend consumption
        if grammar_results['has_errors']:
            frontend_issues = []
            for field_error in grammar_results['fields_with_errors']:
                frontend_issues.append({
                    'field': field_error['field'],
                    'issues': [
                        {
                            'message': error['message'],
                            'ruleId': error.get('rule_id'),
                            'offset': error.get('offset'),
                            'length': error.get('length'),
                            'context': error.get('context'),
                            'replacements': error.get('suggestions', [])
                        } for error in field_error['errors']
                    ]
                })
            question['grammar_issues'] = frontend_issues
        else:
            question['grammar_issues'] = []
        
        return question
    
    def check_questions(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Check grammar for a list of questions.
        
        Args:
            questions (list): List of question objects
            
        Returns:
            list: List of questions with grammar check results added
        """
        if not self.tool:
            logging.warning("Grammar checker not available, skipping grammar check")
            for question in questions:
                question['grammar_check'] = {
                    'checked': False,
                    'error': 'Grammar checker not available'
                }
                question['has_potential_grammar_error'] = False
                question['has_grammar_issues'] = False
                question['grammar_issue_count'] = 0
                question['grammar_issues'] = []
            return questions
        
        checked_questions = []
        total_questions = len(questions)
        questions_with_errors = 0
        
        logging.info(f"Starting grammar check for {total_questions} questions")
        
        for i, question in enumerate(questions):
            checked_question = self.check_question(question)
            checked_questions.append(checked_question)
            
            if checked_question.get('has_potential_grammar_error', False):
                questions_with_errors += 1
            
            # Log progress for large batches
            if (i + 1) % 50 == 0 or (i + 1) == total_questions:
                logging.info(f"Grammar check progress: {i + 1}/{total_questions} questions processed")
        
        logging.info(f"Grammar check completed: {questions_with_errors}/{total_questions} questions have potential grammar errors")
        
        return checked_questions
    
    def get_summary_stats(self, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary statistics for grammar check results.
        
        Args:
            questions (list): List of questions with grammar check results
            
        Returns:
            dict: Summary statistics
        """
        total_questions = len(questions)
        questions_with_errors = 0
        total_errors = 0
        questions_checked = 0
        
        error_by_type = {}
        error_by_field = {}
        
        for question in questions:
            grammar_check = question.get('grammar_check', {})
            
            if grammar_check.get('checked', False):
                questions_checked += 1
                
                if grammar_check.get('has_errors', False):
                    questions_with_errors += 1
                    total_errors += grammar_check.get('total_errors', 0)
                    
                    # Count by question type
                    q_type = question.get('type', 'unknown')
                    error_by_type[q_type] = error_by_type.get(q_type, 0) + 1
                    
                    # Count by field
                    for field_error in grammar_check.get('fields_with_errors', []):
                        field_name = field_error['field']
                        error_by_field[field_name] = error_by_field.get(field_name, 0) + field_error['error_count']
        
        return {
            'total_questions': total_questions,
            'questions_checked': questions_checked,
            'questions_with_errors': questions_with_errors,
            'total_errors': total_errors,
            'error_rate': round(questions_with_errors / questions_checked * 100, 2) if questions_checked > 0 else 0,
            'errors_by_question_type': error_by_type,
            'errors_by_field': error_by_field
        }
    
    def close(self):
        """Close the grammar checker and clean up resources."""
        if self.tool:
            try:
                self.tool.close()
                logging.info("Grammar checker closed successfully")
            except Exception as e:
                logging.error(f"Error closing grammar checker: {str(e)}")


def check_questions_grammar(questions: List[Dict[str, Any]], language='en-US') -> tuple:
    """
    Convenience function to check grammar for a list of questions.
    
    Args:
        questions (list): List of question objects
        language (str): Language code for grammar checking
        
    Returns:
        tuple: (checked_questions, summary_stats)
    """
    checker = GrammarChecker(language=language)
    
    try:
        checked_questions = checker.check_questions(questions)
        summary_stats = checker.get_summary_stats(checked_questions)
        return checked_questions, summary_stats
    finally:
        checker.close()
