"""
Optimized Duplicate Question Detection Module
Uses batch processing and pre-computed embeddings for better performance with large datasets.
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
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import lru_cache
import pickle
import hashlib

class OptimizedQuestionDuplicateDetector:
    def __init__(self, similarity_threshold: float = 0.6, use_cache: bool = True, n_jobs: int = None):
        """
        Initialize the optimized duplicate detector
        
        Args:
            similarity_threshold: Combined similarity threshold (0-1)
            use_cache: Whether to use caching for expensive operations
            n_jobs: Number of parallel jobs (None = auto-detect)
        """
        self.similarity_threshold = similarity_threshold
        self.use_cache = use_cache
        self.n_jobs = n_jobs or min(mp.cpu_count(), 8)
        
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
        
        # Cache for expensive operations
        self._embedding_cache = {}
        self._similarity_cache = {}
    
    def find_duplicate_groups_optimized(self, questions: List[Dict]) -> List[List[Dict]]:
        """
        Optimized duplicate detection using batch processing and pre-computed similarities
        """
        if not questions or len(questions) < 2:
            return [[q] for q in questions] if questions else []
        
        logging.info(f"Processing {len(questions)} questions for duplicates...")
        
        # Step 1: Extract all texts and pre-compute embeddings
        texts = [self._extract_question_text(q) for q in questions]
        
        # Step 2: Fast pre-filtering using TF-IDF
        logging.info("Computing TF-IDF similarities...")
        tfidf_matrix = self._compute_tfidf_batch(texts)
        
        # Step 3: Find candidate pairs using TF-IDF threshold
        candidate_pairs = self._find_candidate_pairs(tfidf_matrix, threshold=0.3)
        logging.info(f"Found {len(candidate_pairs)} candidate pairs for detailed analysis")
        
        # Step 4: Detailed similarity for candidate pairs only
        logging.info("Computing detailed similarities for candidates...")
        similarity_matrix = self._compute_detailed_similarities_batch(
            questions, texts, candidate_pairs
        )
        
        # Step 5: Group similar questions
        groups = self._cluster_questions(questions, similarity_matrix)
        
        logging.info(f"Found {len([g for g in groups if len(g) > 1])} duplicate groups")
        return groups
    
    def _compute_tfidf_batch(self, texts: List[str]) -> np.ndarray:
        """Compute TF-IDF similarity matrix for all texts at once"""
        try:
            # Normalize texts
            normalized_texts = [self.normalize_text(text) for text in texts]
            
            # Filter out empty texts
            non_empty_indices = [i for i, text in enumerate(normalized_texts) if text.strip()]
            non_empty_texts = [normalized_texts[i] for i in non_empty_indices]
            
            if len(non_empty_texts) < 2:
                return np.zeros((len(texts), len(texts)))
            
            # Compute TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform(non_empty_texts)
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Expand back to original size
            full_matrix = np.zeros((len(texts), len(texts)))
            for i, orig_i in enumerate(non_empty_indices):
                for j, orig_j in enumerate(non_empty_indices):
                    full_matrix[orig_i][orig_j] = similarity_matrix[i][j]
            
            return full_matrix
        except Exception as e:
            logging.warning(f"TF-IDF batch computation failed: {e}")
            return np.zeros((len(texts), len(texts)))
    
    def _find_candidate_pairs(self, similarity_matrix: np.ndarray, threshold: float = 0.3) -> List[Tuple[int, int]]:
        """Find candidate pairs based on TF-IDF similarity threshold"""
        candidates = []
        n = similarity_matrix.shape[0]
        
        for i in range(n):
            for j in range(i + 1, n):
                if similarity_matrix[i][j] >= threshold:
                    candidates.append((i, j))
        
        return candidates
    
    def _compute_detailed_similarities_batch(self, questions: List[Dict], texts: List[str], 
                                           candidate_pairs: List[Tuple[int, int]]) -> np.ndarray:
        """Compute detailed similarities only for candidate pairs"""
        n = len(questions)
        similarity_matrix = np.zeros((n, n))
        
        # Set diagonal to 1.0
        np.fill_diagonal(similarity_matrix, 1.0)
        
        if not candidate_pairs:
            return similarity_matrix
        
        # Pre-compute embeddings for all texts if using semantic similarity
        embeddings = None
        if self.sentence_model:
            try:
                embeddings = self.sentence_model.encode(texts, batch_size=32, show_progress_bar=False)
            except Exception as e:
                logging.warning(f"Batch embedding computation failed: {e}")
        
        # Process candidate pairs in batches
        batch_size = 1000
        for i in range(0, len(candidate_pairs), batch_size):
            batch = candidate_pairs[i:i + batch_size]
            
            # Use threading for I/O bound operations
            with ThreadPoolExecutor(max_workers=self.n_jobs) as executor:
                futures = []
                for idx1, idx2 in batch:
                    future = executor.submit(
                        self._calculate_similarity_optimized,
                        questions[idx1], questions[idx2], texts[idx1], texts[idx2],
                        embeddings[idx1] if embeddings is not None else None,
                        embeddings[idx2] if embeddings is not None else None
                    )
                    futures.append((idx1, idx2, future))
                
                # Collect results
                for idx1, idx2, future in futures:
                    try:
                        similarity = future.result(timeout=30)
                        similarity_matrix[idx1][idx2] = similarity
                        similarity_matrix[idx2][idx1] = similarity
                    except Exception as e:
                        logging.warning(f"Similarity calculation failed for pair ({idx1}, {idx2}): {e}")
        
        return similarity_matrix
    
    def _calculate_similarity_optimized(self, q1: Dict, q2: Dict, text1: str, text2: str,
                                      embedding1=None, embedding2=None) -> float:
        """Optimized similarity calculation with pre-computed embeddings"""
        if not text1 or not text2:
            return 0.0
        
        # Use cache if available
        if self.use_cache:
            cache_key = self._get_cache_key(text1, text2)
            if cache_key in self._similarity_cache:
                return self._similarity_cache[cache_key]
        
        # Calculate different types of similarity
        exact_sim = self.calculate_exact_similarity(text1, text2)
        keyword_sim = self.calculate_keyword_similarity(text1, text2)
        
        # Use pre-computed embeddings for semantic similarity
        semantic_sim = 0.0
        if embedding1 is not None and embedding2 is not None:
            try:
                semantic_sim = cosine_similarity([embedding1], [embedding2])[0][0]
            except:
                semantic_sim = 0.0
        
        # For TF-IDF, we already have it from the pre-filtering step
        # So we'll use a simplified approach here
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
        
        # Cache result
        if self.use_cache:
            self._similarity_cache[cache_key] = combined_similarity
        
        return combined_similarity
    
    def _cluster_questions(self, questions: List[Dict], similarity_matrix: np.ndarray) -> List[List[Dict]]:
        """Cluster questions based on similarity matrix using Union-Find"""
        n = len(questions)
        parent = list(range(n))
        
        def find(x):
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]
        
        def union(x, y):
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py
        
        # Union similar questions
        for i in range(n):
            for j in range(i + 1, n):
                if similarity_matrix[i][j] >= self.similarity_threshold:
                    union(i, j)
        
        # Group questions by their root parent
        groups_dict = {}
        for i in range(n):
            root = find(i)
            if root not in groups_dict:
                groups_dict[root] = []
            groups_dict[root].append(questions[i])
        
        return list(groups_dict.values())
    
    def _get_cache_key(self, text1: str, text2: str) -> str:
        """Generate cache key for text pair"""
        combined = f"{text1}|||{text2}" if text1 < text2 else f"{text2}|||{text1}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    # Keep all the original methods for compatibility
    def calculate_exact_similarity(self, q1: str, q2: str) -> float:
        """Calculate exact text similarity"""
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
        """Calculate similarity based on keywords"""
        keywords1 = self.extract_keywords(q1)
        keywords2 = self.extract_keywords(q2)
        
        if not keywords1 or not keywords2:
            return 0.0
        
        intersection = keywords1.intersection(keywords2)
        union = keywords1.union(keywords2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison"""
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
        """Extract meaningful keywords from text"""
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
    
    def _extract_question_text(self, question: Dict) -> str:
        """Extract text content from question for comparison"""
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
    
    def annotate_duplicates(self, questions: List[Dict]) -> Tuple[List[Dict], Dict]:
        """Optimized duplicate annotation"""
        if not questions:
            return [], {"groups": [], "group_count": 0, "duplicate_question_count": 0}

        groups = self.find_duplicate_groups_optimized(questions)
        annotated = list(questions)  # shallow copy
        duplicate_groups_info = []
        group_id_counter = 1
        duplicate_question_total = 0

        for group in groups:
            if len(group) <= 1:
                continue
            
            # Determine representative
            representative = max(group, key=self._score_question_completeness)
            group_member_infos = []
            
            for q in group:
                similarity = 1.0 if q is representative else self._calculate_similarity_optimized(
                    q, representative, 
                    self._extract_question_text(q), 
                    self._extract_question_text(representative)
                )
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
    
    def _score_question_completeness(self, question: Dict) -> int:
        """Score question based on how complete/detailed it is"""
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
    
    def remove_duplicates(self, questions: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Remove duplicate questions and return filtered list and removed duplicates
        """
        if not questions:
            return [], []
        
        groups = self.find_duplicate_groups_optimized(questions)
        unique_questions = []
        removed_duplicates = []
        
        for group in groups:
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
                            'similarity': self._calculate_similarity_optimized(
                                q, best_question, 
                                self._extract_question_text(q), 
                                self._extract_question_text(best_question)
                            )
                        })
        
        return unique_questions, removed_duplicates


def annotate_duplicates_in_questions_optimized(questions: List[Dict],
                                             similarity_threshold: float = 0.6,
                                             n_jobs: int = None) -> Tuple[List[Dict], Dict]:
    """Optimized convenience wrapper to annotate duplicate questions."""
    detector = OptimizedQuestionDuplicateDetector(
        similarity_threshold=similarity_threshold, 
        n_jobs=n_jobs
    )
    return detector.annotate_duplicates(questions)