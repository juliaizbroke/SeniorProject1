# backend/duplicate_config.py

"""
Configuration settings for duplicate detection system.
"""

# Default similarity threshold for duplicate detection
DEFAULT_SIMILARITY_THRESHOLD = 0.8

# Minimum similarity threshold allowed
MIN_SIMILARITY_THRESHOLD = 0.5

# Maximum similarity threshold allowed
MAX_SIMILARITY_THRESHOLD = 1.0

# Weight factors for different similarity methods
SIMILARITY_WEIGHTS = {
    'exact': 0.3,      # Exact text matching weight
    'semantic': 0.4,   # Semantic similarity weight
    'tfidf': 0.2,      # TF-IDF similarity weight
    'keyword': 0.1     # Keyword overlap weight
}

# Settings for different question types
QUESTION_TYPE_SETTINGS = {
    'multiple choice': {
        'include_options_in_comparison': True,
        'options_weight': 0.3  # How much options contribute to similarity
    },
    'true/false': {
        'answer_weight': 0.2  # How much the answer contributes to similarity
    },
    'written question': {
        'include_answer_in_comparison': True,
        'answer_weight': 0.4
    },
    'matching': {
        'include_answer_in_comparison': True,
        'answer_weight': 0.3
    }
}

# Text preprocessing settings
TEXT_PREPROCESSING = {
    'remove_punctuation': True,
    'convert_to_lowercase': True,
    'remove_extra_whitespace': True,
    'remove_stopwords': True,
    'apply_stemming': True
}

# Sentence transformer model to use
SENTENCE_TRANSFORMER_MODEL = 'all-MiniLM-L6-v2'

# TF-IDF settings
TFIDF_SETTINGS = {
    'max_features': 1000,
    'ngram_range': (1, 2),  # Use unigrams and bigrams
    'min_df': 1,
    'max_df': 0.95
}

# Keyword extraction settings
KEYWORD_SETTINGS = {
    'min_keyword_length': 3,
    'max_keywords_per_question': 10,
    'use_pos_filtering': True,  # Filter by part-of-speech
    'allowed_pos_tags': ['NN', 'NNS', 'NNP', 'NNPS', 'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'JJ', 'JJR', 'JJS']
}

# Logging settings
LOGGING_SETTINGS = {
    'log_similarity_scores': False,
    'log_duplicate_groups': True,
    'log_removed_questions': True
}
