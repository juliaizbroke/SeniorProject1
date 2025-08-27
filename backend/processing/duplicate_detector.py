"""
Duplicate Question Detection Module
Uses multiple NLP techniques to identify and remove duplicate or similar questions.
"""

import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Tuple, Set
import logging

class QuestionDuplicateDetector:
    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize the duplicate detector
        
        Args:
            similarity_threshold: Combined similarity threshold (0-1)
        """
        self.similarity_threshold = similarity_threshold
        
        # Initialize NLP components
        self.stemmer = PorterStemmer()
        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        
        # Initialize sentence transformer for semantic similarity
        try:
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            logging.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logging.warning(f"Could not load sentence transformer: {e}")
            self.sentence_model = None
        
        # Download required NLTK data
        self._download_nltk_data()
        
        # Get stopwords
        try:
            self.stop_words = set(stopwords.words('english'))
        except:
            logging.warning("Could not load NLTK stopwords")
            self.stop_words = set()
    
    def calculate_similarity(self, q1: Dict, q2: Dict) -> float:
        """
        Calculate overall similarity between two questions using multiple methods
        """
        # Extract text content
        text1 = self._extract_question_text(q1)
        text2 = self._extract_question_text(q2)
        
        if not text1 or not text2:
            return 0.0
        
        # Calculate different types of similarity
        exact_sim = self.calculate_exact_similarity(text1, text2)
        keyword_sim = self.calculate_keyword_similarity(text1, text2)
        
        # Calculate semantic similarity
        semantic_sim = 0.0
        if self.sentence_model:
            try:
                embeddings = self.sentence_model.encode([text1, text2])
                semantic_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            except:
                semantic_sim = 0.0
        
        # Calculate TF-IDF similarity
        tfidf_sim = 0.0
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            if tfidf_matrix.shape[0] == 2:
                tfidf_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        except:
            tfidf_sim = 0.0
        
        # Combine similarities with weights
        combined_similarity = (
            exact_sim * 0.3 +
            semantic_sim * 0.4 +
            tfidf_sim * 0.2 +
            keyword_sim * 0.1
        )
        
        return combined_similarity
    
    def find_duplicate_groups(self, questions: List[Dict]) -> List[List[Dict]]:
        """
        Find groups of duplicate questions
        """
        if not questions:
            return []
        
        groups = []
        processed = set()
        
        for i, q1 in enumerate(questions):
            if i in processed:
                continue
            
            current_group = [q1]
            processed.add(i)
            
            for j, q2 in enumerate(questions[i+1:], i+1):
                if j in processed:
                    continue
                
                similarity = self.calculate_similarity(q1, q2)
                if similarity >= self.similarity_threshold:
                    current_group.append(q2)
                    processed.add(j)
            
            groups.append(current_group)
        
        return groups
    
    def remove_duplicates(self, questions: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Remove duplicate questions and return filtered list and removed duplicates
        """
        if not questions:
            return [], []
        
        duplicate_groups = self.find_duplicate_groups(questions)
        unique_questions = []
        removed_duplicates = []
        
        for group in duplicate_groups:
            if len(group) == 1:
                # No duplicates in this group
                unique_questions.append(group[0])
            else:
                # Choose best question from the group
                best_question = max(group, key=self._score_question_completeness)
                unique_questions.append(best_question)
                
                # Add others to removed list
                for q in group:
                    if q != best_question:
                        removed_duplicates.append({
                            'question': q,
                            'kept_instead': best_question,
                            'similarity': self.calculate_similarity(q, best_question)
                        })
        
        return unique_questions, removed_duplicates

    # --- New functionality: annotate duplicates instead of removing them ---
    def annotate_duplicates(self, questions: List[Dict]) -> Tuple[List[Dict], Dict]:
        """Annotate questions with duplicate grouping metadata instead of removing them.

        Returns:
            (questions_with_annotations, info_dict)
            Each question in a duplicate group (size > 1) gains:
                is_duplicate: bool
                duplicate_group_id: int (1-based)
                duplicate_representative: bool (True if chosen representative)
                duplicate_similarity: float (similarity to representative, representative = 1.0)
        """
        if not questions:
            return [], {"groups": [], "group_count": 0, "duplicate_question_count": 0}

        groups = self.find_duplicate_groups(questions)
        annotated = list(questions)  # shallow copy
        duplicate_groups_info = []
        group_id_counter = 1
        duplicate_question_total = 0

        for group in groups:
            if len(group) <= 1:
                continue
            # Determine representative (reuse completeness scoring)
            representative = max(group, key=self._score_question_completeness)
            group_member_infos = []
            for q in group:
                similarity = 1.0 if q is representative else self.calculate_similarity(q, representative)
                q["is_duplicate"] = True
                q["duplicate_group_id"] = group_id_counter
                q["duplicate_representative"] = (q is representative)
                q["duplicate_similarity"] = round(float(similarity), 4)
                group_member_infos.append({
                    "question_text": q.get("question", "")[:120],
                    "is_representative": q is representative,
                    "similarity": round(float(similarity), 4)
                })
            duplicate_groups_info.append({
                "group_id": group_id_counter,
                "size": len(group),
                "representative_text": representative.get("question", "")[:120],
                "members": group_member_infos
            })
            duplicate_question_total += len(group)
            group_id_counter += 1

        info = {
            "groups": duplicate_groups_info,
            "group_count": len(duplicate_groups_info),
            "duplicate_question_count": duplicate_question_total,
            "similarity_threshold": self.similarity_threshold
        }
        return annotated, info
    
    def _extract_question_text(self, question: Dict) -> str:
        """
        Extract text content from question for comparison
        """
        text = question.get('question', '')
        
        # For multiple choice, include options
        if question.get('type') == 'multiple choice':
            options = [question.get(opt, '') for opt in ['a', 'b', 'c', 'd', 'e'] if question.get(opt, '')]
            text += ' ' + ' '.join(options)
        
        # For written questions, include answer if significant
        elif question.get('type') == 'written question' and len(question.get('answer', '')) > 20:
            text += ' ' + question.get('answer', '')
        
        return text
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
    
    def normalize_text(self, text: str) -> str:
        """
        Normalize text for comparison
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text)
        
        # Remove punctuation but keep question marks
        text = re.sub(r'[^\w\s\?]', ' ', text)
        
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_keywords(self, text: str) -> Set[str]:
        """
        Extract meaningful keywords from text
        """
        normalized = self.normalize_text(text)
        
        # Tokenize
        try:
            tokens = word_tokenize(normalized)
        except:
            tokens = normalized.split()
        
        # Remove stopwords and short words
        keywords = set()
        for token in tokens:
            if (len(token) > 2 and 
                token not in self.stop_words and 
                token not in string.punctuation):
                # Add both original and stemmed version
                keywords.add(token)
                keywords.add(self.stemmer.stem(token))
        
        return keywords
    
    def calculate_exact_similarity(self, q1: str, q2: str) -> float:
        """
        Calculate exact text similarity
        """
        norm1 = self.normalize_text(q1)
        norm2 = self.normalize_text(q2)
        
        if norm1 == norm2:
            return 1.0
        
        # Jaccard similarity on words
        words1 = set(norm1.split())
        words2 = set(norm2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def calculate_keyword_similarity(self, q1: str, q2: str) -> float:
        """
        Calculate similarity based on keywords
        """
        keywords1 = self.extract_keywords(q1)
        keywords2 = self.extract_keywords(q2)
        
        if not keywords1 or not keywords2:
            return 0.0
        
        intersection = keywords1.intersection(keywords2)
        union = keywords1.union(keywords2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def calculate_tfidf_similarity(self, questions: List[str]) -> np.ndarray:
        """
        Calculate TF-IDF cosine similarity matrix
        """
        if len(questions) < 2:
            return np.zeros((len(questions), len(questions)))
        
        try:
            normalized_questions = [self.normalize_text(q) for q in questions]
            # Filter out empty questions
            non_empty_questions = [q for q in normalized_questions if q.strip()]
            
            if len(non_empty_questions) < 2:
                return np.zeros((len(questions), len(questions)))
            
            tfidf_matrix = self.vectorizer.fit_transform(non_empty_questions)
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Expand back to original size if we filtered out empty questions
            if len(non_empty_questions) != len(questions):
                full_matrix = np.zeros((len(questions), len(questions)))
                non_empty_indices = [i for i, q in enumerate(normalized_questions) if q.strip()]
                
                for i, orig_i in enumerate(non_empty_indices):
                    for j, orig_j in enumerate(non_empty_indices):
                        full_matrix[orig_i][orig_j] = similarity_matrix[i][j]
                
                return full_matrix
            
            return similarity_matrix
        except Exception as e:
            logging.warning(f"TF-IDF calculation failed: {e}")
            return np.zeros((len(questions), len(questions)))
    
    def calculate_semantic_similarity(self, questions: List[str]) -> np.ndarray:
        """
        Calculate semantic similarity using sentence transformers
        """
        if not self.sentence_model or len(questions) < 2:
            return np.zeros((len(questions), len(questions)))
        
        try:
            # Filter out empty questions for embedding
            non_empty_questions = [q if q.strip() else "empty question" for q in questions]
            embeddings = self.sentence_model.encode(non_empty_questions)
            similarity_matrix = cosine_similarity(embeddings)
            return similarity_matrix
        except Exception as e:
            logging.warning(f"Semantic similarity calculation failed: {e}")
            return np.zeros((len(questions), len(questions)))
    
    def _score_question_completeness(self, question: Dict) -> int:
        """
        Score question based on how complete/detailed it is
        """
        score = 0
        
        # Basic question text
        if question.get('question', '').strip():
            score += len(question['question'].strip())
        
        # Multiple choice options
        if question.get('type') == 'multiple choice':
            for opt in ['a', 'b', 'c', 'd', 'e']:
                if question.get(opt, '').strip():
                    score += len(question[opt].strip())
        
        # Answer completeness
        if question.get('answer', '').strip():
            score += len(question['answer'].strip()) * 2  # Weight answers more
        
        # Category information
        if question.get('category', '').strip():
            score += 10
        
        # Image presence
        if question.get('image', ''):
            score += 20
        
        return score
    


def annotate_duplicates_in_questions(questions: List[Dict],
                                     similarity_threshold: float = 0.8) -> Tuple[List[Dict], Dict]:
    """Convenience wrapper to annotate duplicate questions without removing them."""
    detector = QuestionDuplicateDetector(similarity_threshold=similarity_threshold)
    return detector.annotate_duplicates(questions)
