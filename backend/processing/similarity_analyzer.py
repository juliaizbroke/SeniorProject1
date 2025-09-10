"""
Similarity Analysis System for Word Documents
Implements TF-IDF + Semantic similarity checking for exam papers
"""

import os
import json
import time
import shutil
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from docx import Document
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentSimilarityAnalyzer:
    def __init__(self, temp_base_dir: str = "similarityCheck/similarity_temp"):
        self.temp_base_dir = temp_base_dir
        self.similarity_threshold = 0.7
        self.tfidf_vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=5000,
            ngram_range=(1, 2),
            lowercase=True,
            strip_accents='unicode'
        )
        
        # Ensure temp directory exists
        os.makedirs(temp_base_dir, exist_ok=True)
    
    def create_session(self) -> str:
        """Create a new similarity analysis session"""
        timestamp = int(time.time())
        random_suffix = os.urandom(4).hex()
        session_id = f"similarity_{timestamp}_{random_suffix}"
        
        session_path = os.path.join(self.temp_base_dir, session_id)
        os.makedirs(session_path, exist_ok=True)
        os.makedirs(os.path.join(session_path, "uploaded_files"), exist_ok=True)
        os.makedirs(os.path.join(session_path, "extracted_content"), exist_ok=True)
        os.makedirs(os.path.join(session_path, "analysis_results"), exist_ok=True)
        
        # Create session info
        session_info = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "files_uploaded": [],
            "analysis_completed": False,
            "expires_at": (datetime.now() + timedelta(hours=2)).isoformat()
        }
        
        with open(os.path.join(session_path, "session_info.json"), 'w') as f:
            json.dump(session_info, f, indent=2)
        
        logger.info(f"Created similarity session: {session_id}")
        return session_id
    
    def extract_questions_from_docx(self, file_path: str) -> Dict[str, Any]:
        """Extract questions and answers from Word document"""
        try:
            doc = Document(file_path)
            questions = []
            current_question = ""
            
            # Common exam instructions to ignore
            instruction_patterns = [
                # Basic instructions
                r'answer.*questions.*using.*pencil',
                r'write.*id.*name.*section',
                r'do not forget.*blacken.*id',
                r'avoid.*academic.*cheating',
                r'not.*taking.*part.*exam.*paper',
                r'failure.*incomplete.*grade',
                r'read.*questions.*carefully',
                r'blacken.*best.*answer',
                r'answer.*sheet',
                r'computerized.*answer.*sheet',
                r'subject.*deduction',
                
                # Part headers and instructions
                r'part\s+[ivx]+:.*questions',
                r'instruction:.*',
                r'continue.*part',
                r'multiple.*choice.*questions',
                r'true.*false.*questions',
                r'matching.*questions',
                r'short.*questions',
                r'long.*questions',
                r'essay.*questions',
                
                # Common formatting
                r'^\d+\s*marks?\s*each',
                r'questions?\s*:\s*\d+\s*marks?',
                r'limit.*answers.*lines',
                r'use.*examples.*diagrams',
                r'answer.*booklet.*provided',
                r'clearly.*descriptively',
                
                # Generic headers/footers
                r'header', r'footer', r'page \d+',
                r'name:', r'date:', r'class:', r'section:', r'student id',
            ]
            
            def is_instruction_text(text: str) -> bool:
                """Check if text is a common exam instruction"""
                text_lower = text.lower().strip()
                
                # Skip empty or very short text
                if len(text_lower) < 5:
                    return True
                
                # Check against instruction patterns
                for pattern in instruction_patterns:
                    if re.search(pattern, text_lower, re.IGNORECASE):
                        return True
                
                # Skip lines that are mostly punctuation or formatting
                if len(re.sub(r'[^a-zA-Z0-9]', '', text_lower)) < 3:
                    return True
                
                return False
            
            # Extract all paragraphs first
            all_paragraphs = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text and not is_instruction_text(text):
                    all_paragraphs.append(text)
            
            # Comprehensive question extraction for all types
            questions_by_type = {
                'mcq': [],
                'true_false': [],
                'matching': [],
                'short_answer': [],
                'essay': [],
                'fill_blank': [],
                'other': []
            }
            
            i = 0
            while i < len(all_paragraphs):
                text = all_paragraphs[i]
                
                # Detect question number patterns
                question_match = re.match(r'^(\d+)[\.\)\s]+(.+)', text, re.IGNORECASE)
                if not question_match:
                    i += 1
                    continue
                
                question_num = question_match.group(1)
                question_content = question_match.group(2).strip()
                
                # Build complete question by looking ahead for options/content
                complete_question = text
                question_type = 'other'
                j = i + 1
                
                # Look ahead for MCQ options (a, b, c, d)
                mcq_options = []
                while j < len(all_paragraphs) and j < i + 10:  # Look max 10 lines ahead
                    next_text = all_paragraphs[j]
                    
                    # Check if it's an MCQ option
                    mcq_match = re.match(r'^[a-eA-E][\.\)]\s*(.+)', next_text)
                    if mcq_match:
                        mcq_options.append(next_text)
                        complete_question += " " + next_text
                        j += 1
                    # Check if it's the start of next question
                    elif re.match(r'^\d+[\.\)\s]+', next_text):
                        break
                    # Check for continuation of current question
                    elif len(next_text) > 5 and not re.match(r'^[A-Z][a-z]+\s*[IVX]+:', next_text):
                        complete_question += " " + next_text
                        j += 1
                    else:
                        break
                
                # Determine question type based on content and structure
                question_lower = question_content.lower()
                
                if mcq_options:
                    question_type = 'mcq'
                elif (re.search(r'\b(true|false)\b', question_lower) or 
                      re.search(r'\b(correct|incorrect)\b', question_lower) or
                      'T or F' in complete_question or
                      'True/False' in complete_question):
                    question_type = 'true_false'
                elif (re.search(r'\b(match|matching|column)\b', question_lower) or
                      'Column A' in complete_question or 'Column B' in complete_question):
                    question_type = 'matching'
                elif (re.search(r'\b(fill|blank|complete)\b', question_lower) or
                      '____' in complete_question or '___' in complete_question):
                    question_type = 'fill_blank'
                elif (re.search(r'\b(describe|explain|discuss|analyze|compare|essay)\b', question_lower) or
                      re.search(r'\b(write|composition|paragraph)\b', question_lower) or
                      len(question_content.split()) > 15):
                    question_type = 'essay'
                elif (re.search(r'\b(short|brief|list|define|name)\b', question_lower) or
                      len(question_content.split()) <= 15):
                    question_type = 'short_answer'
                
                # Clean and store the question
                clean_question = complete_question.strip()
                if len(clean_question.split()) >= 3:  # Minimum word count
                    questions_by_type[question_type].append({
                        'number': question_num,
                        'content': clean_question,
                        'type': question_type
                    })
                    questions.append(clean_question)
                
                # Move to next unprocessed paragraph
                i = j if j > i + 1 else i + 1
            
            # Also extract standalone questions (without numbers)
            for text in all_paragraphs:
                if (not re.match(r'^\d+[\.\)\s]+', text) and 
                    len(text) > 20 and
                    (text.endswith('?') or 
                     re.search(r'\b(what|where|when|why|how|which|who|is|are|do|does)\b', text.lower()))):
                    questions.append(text)
                    questions_by_type['other'].append({
                        'number': 'unnumbered',
                        'content': text,
                        'type': 'standalone'
                    })
            
            # Extract additional patterns for completeness
            mcq_options = []
            matching_pairs = []
            true_false_statements = []
            
            for text in all_paragraphs:
                # MCQ options
                if re.match(r'^[a-eA-E][\.\)]\s*\w+', text):
                    mcq_options.append(text)
                
                # Matching pairs (Column A/B format)
                if re.search(r'^[A-Z]\.\s*\w+', text):
                    matching_pairs.append(text)
                
                # True/False statements
                if re.search(r'\b(true|false|T|F)\b', text, re.IGNORECASE) and len(text.split()) > 2:
                    true_false_statements.append(text)
            
            logger.info(f"Extracted {len(questions)} questions from {os.path.basename(file_path)}")
            logger.info(f"Question types found: MCQ({len(questions_by_type['mcq'])}), "
                       f"T/F({len(questions_by_type['true_false'])}), "
                       f"Matching({len(questions_by_type['matching'])}), "
                       f"Short({len(questions_by_type['short_answer'])}), "
                       f"Essay({len(questions_by_type['essay'])})")
            
            return {
                "questions": questions,
                "questions_by_type": questions_by_type,
                "mcq_options": mcq_options,
                "matching_pairs": matching_pairs,
                "true_false_statements": true_false_statements,
                "total_questions": len(questions),
                "extraction_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error extracting questions from {file_path}: {str(e)}")
            return {
                "questions": [],
                "mcq_options": [],
                "total_questions": 0,
                "error": str(e)
            }
    
    def calculate_tfidf_similarity(self, text1: str, text2: str) -> float:
        """Calculate TF-IDF similarity between two texts"""
        try:
            documents = [text1, text2]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(documents)
            similarity_matrix = cosine_similarity(tfidf_matrix)
            return float(similarity_matrix[0][1])
        except Exception as e:
            logger.error(f"Error calculating TF-IDF similarity: {str(e)}")
            return 0.0
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity (placeholder for now)"""
        # For now, return a simulated semantic similarity
        # In production, you would use sentence-transformers or similar
        try:
            # Simple word overlap-based similarity as placeholder
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            if len(union) == 0:
                return 0.0
            
            jaccard_similarity = len(intersection) / len(union)
            return min(jaccard_similarity * 1.5, 1.0)  # Boost semantic score slightly
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {str(e)}")
            return 0.0
    
    def compare_documents(self, doc1_content: Dict, doc2_content: Dict) -> Dict[str, Any]:
        """Compare two documents using TF-IDF and semantic analysis"""
        questions1 = " ".join(doc1_content.get("questions", []))
        questions2 = " ".join(doc2_content.get("questions", []))
        
        if not questions1 or not questions2:
            return {
                "similarity_score": 0.0,
                "method_used": "none",
                "details": "One or both documents have no extractable questions",
                "processing_time": 0.0
            }
        
        start_time = time.time()
        
        # Step 1: TF-IDF Similarity
        tfidf_score = self.calculate_tfidf_similarity(questions1, questions2)
        
        method_used = "tfidf"
        final_score = tfidf_score
        
        # Step 2: Semantic Analysis (if TF-IDF < threshold)
        if tfidf_score < self.similarity_threshold:
            semantic_score = self.calculate_semantic_similarity(questions1, questions2)
            final_score = max(tfidf_score, semantic_score)
            method_used = "tfidf_semantic"
        
        processing_time = time.time() - start_time
        
        # Find potentially matching questions
        matching_questions = self.find_matching_questions(
            doc1_content.get("questions", []), 
            doc2_content.get("questions", [])
        )
        
        return {
            "similarity_score": round(final_score, 3),
            "tfidf_score": round(tfidf_score, 3),
            "semantic_score": round(self.calculate_semantic_similarity(questions1, questions2), 3) if tfidf_score < self.similarity_threshold else None,
            "method_used": method_used,
            "matching_questions": matching_questions,
            "processing_time": round(processing_time, 3)
        }
    
    def find_matching_questions(self, questions1: List[str], questions2: List[str]) -> List[Dict]:
        """Find potentially matching questions between documents"""
        matches = []
        
        for i, q1 in enumerate(questions1):
            for j, q2 in enumerate(questions2):
                similarity = self.calculate_tfidf_similarity(q1, q2)
                if similarity > 0.6:  # Lower threshold for individual questions
                    matches.append({
                        "question1_index": i,
                        "question2_index": j,
                        "question1": q1[:100] + "..." if len(q1) > 100 else q1,
                        "question2": q2[:100] + "..." if len(q2) > 100 else q2,
                        "similarity": round(similarity, 3)
                    })
        
        # Sort by similarity score (highest first)
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        return matches[:10]  # Return top 10 matches
    
    def analyze_session(self, session_id: str) -> Dict[str, Any]:
        """Analyze all documents in a session and create similarity matrix"""
        session_path = os.path.join(self.temp_base_dir, session_id)
        uploaded_files_path = os.path.join(session_path, "uploaded_files")
        extracted_content_path = os.path.join(session_path, "extracted_content")
        results_path = os.path.join(session_path, "analysis_results")
        
        if not os.path.exists(uploaded_files_path):
            raise ValueError(f"Session {session_id} not found")
        
        # Get all uploaded files
        uploaded_files = [f for f in os.listdir(uploaded_files_path) if f.endswith('.docx')]
        
        if len(uploaded_files) < 2:
            raise ValueError("At least 2 documents required for comparison")
        
        # Extract content from all documents
        extracted_content = {}
        for filename in uploaded_files:
            file_path = os.path.join(uploaded_files_path, filename)
            content = self.extract_questions_from_docx(file_path)
            extracted_content[filename] = content
            
            # Save extracted content
            content_file = os.path.join(extracted_content_path, f"{filename}_questions.json")
            with open(content_file, 'w') as f:
                json.dump(content, f, indent=2)
        
        # Create similarity matrix
        similarity_matrix = []
        detailed_comparisons = {}
        
        # Initialize matrix with filenames
        filenames = list(extracted_content.keys())
        matrix_data = {
            "filenames": filenames,
            "matrix": []
        }
        
        # Calculate similarities
        for i, file1 in enumerate(filenames):
            row = []
            for j, file2 in enumerate(filenames):
                if i == j:
                    # Same file - similarity = 1.0
                    row.append(1.0)
                elif f"{file1}_vs_{file2}" in detailed_comparisons or f"{file2}_vs_{file1}" in detailed_comparisons:
                    # Already calculated (symmetric)
                    existing_key = f"{file2}_vs_{file1}" if f"{file2}_vs_{file1}" in detailed_comparisons else f"{file1}_vs_{file2}"
                    row.append(detailed_comparisons[existing_key]["similarity_score"])
                else:
                    # Calculate new comparison
                    comparison = self.compare_documents(
                        extracted_content[file1], 
                        extracted_content[file2]
                    )
                    detailed_comparisons[f"{file1}_vs_{file2}"] = comparison
                    row.append(comparison["similarity_score"])
            
            matrix_data["matrix"].append(row)
        
        # Save results
        matrix_file = os.path.join(results_path, "similarity_matrix.json")
        with open(matrix_file, 'w') as f:
            json.dump(matrix_data, f, indent=2)
        
        details_file = os.path.join(results_path, "detailed_comparisons.json")
        with open(details_file, 'w') as f:
            json.dump(detailed_comparisons, f, indent=2)
        
        # Update session info
        session_info_path = os.path.join(session_path, "session_info.json")
        with open(session_info_path, 'r') as f:
            session_info = json.load(f)
        
        session_info["analysis_completed"] = True
        session_info["analysis_time"] = datetime.now().isoformat()
        session_info["total_comparisons"] = len(detailed_comparisons)
        
        with open(session_info_path, 'w') as f:
            json.dump(session_info, f, indent=2)
        
        logger.info(f"Analysis completed for session {session_id}")
        
        return {
            "session_id": session_id,
            "similarity_matrix": matrix_data,
            "detailed_comparisons": detailed_comparisons,
            "files_analyzed": len(filenames),
            "total_comparisons": len(detailed_comparisons)
        }
    
    def cleanup_session(self, session_id: str) -> bool:
        """Remove a specific session and all its files"""
        session_path = os.path.join(self.temp_base_dir, session_id)
        
        if os.path.exists(session_path):
            try:
                shutil.rmtree(session_path)
                logger.info(f"Cleaned up session: {session_id}")
                return True
            except Exception as e:
                logger.error(f"Error cleaning up session {session_id}: {str(e)}")
                return False
        
        return False
    
    def cleanup_old_sessions(self, max_age_hours: int = 2) -> int:
        """Remove sessions older than specified hours"""
        if not os.path.exists(self.temp_base_dir):
            return 0
        
        cutoff_time = time.time() - (max_age_hours * 3600)
        cleaned_count = 0
        
        for session_folder in os.listdir(self.temp_base_dir):
            if session_folder.startswith("similarity_"):
                session_path = os.path.join(self.temp_base_dir, session_folder)
                if os.path.isdir(session_path):
                    if os.path.getctime(session_path) < cutoff_time:
                        if self.cleanup_session(session_folder):
                            cleaned_count += 1
        
        logger.info(f"Cleaned up {cleaned_count} old sessions")
        return cleaned_count
    
    def get_session_results(self, session_id: str) -> Dict[str, Any]:
        """Get analysis results for a session"""
        session_path = os.path.join(self.temp_base_dir, session_id)
        results_path = os.path.join(session_path, "analysis_results")
        
        if not os.path.exists(results_path):
            raise ValueError(f"Results not found for session {session_id}")
        
        # Load similarity matrix
        matrix_file = os.path.join(results_path, "similarity_matrix.json")
        with open(matrix_file, 'r') as f:
            similarity_matrix = json.load(f)
        
        # Load detailed comparisons
        details_file = os.path.join(results_path, "detailed_comparisons.json")
        with open(details_file, 'r') as f:
            detailed_comparisons = json.load(f)
        
        # Load session info
        session_info_path = os.path.join(session_path, "session_info.json")
        with open(session_info_path, 'r') as f:
            session_info = json.load(f)
        
        return {
            "session_info": session_info,
            "similarity_matrix": similarity_matrix,
            "detailed_comparisons": detailed_comparisons
        }
