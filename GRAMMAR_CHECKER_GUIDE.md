# Grammar Checker Documentation

## Overview

The grammar checker module (`grammar_checker.py`) integrates with the question parser to automatically identify potential grammar errors in exam questions. This helps maintain high quality standards for exam content.

## Features

- **Automatic Detection**: Identifies grammar errors in all question fields (question text, multiple choice options, answers)
- **Non-Destructive**: Does not modify the original questions, only adds metadata about potential issues
- **Frontend Integration**: Adds `has_potential_grammar_error` flag for easy frontend display
- **Detailed Error Information**: Provides specific error messages, suggestions, and error locations
- **Question Type Support**: Works with all question types (multiple choice, true/false, matching, written questions)

## How It Works

1. **During Upload**: When an Excel file is uploaded, the parser automatically runs grammar checking on all questions (unless disabled)
2. **Error Detection**: Uses LanguageTool to identify grammar issues in question text and options
3. **Metadata Addition**: Adds grammar check results to each question object
4. **Frontend Display**: Questions with errors can be marked with "potential grammar error" tags

## Question Object Structure

After grammar checking, each question will have these additional fields:

```json
{
  "question": "What are the capital of France?",
  "type": "multiple choice",
  // ... other question fields ...
  
  // New grammar check fields:
  "has_potential_grammar_error": true,
  "grammar_check": {
    "checked": true,
    "has_errors": true,
    "total_errors": 1,
    "fields_with_errors": [
      {
        "field": "question",
        "error_count": 1,
        "errors": [
          {
            "message": "The verb 'are' is plural. Did you mean: \"is\"?",
            "rule_id": "AGREEMENT_ERROR",
            "category": "Grammar",
            "offset": 5,
            "length": 3,
            "context": "What are the capital",
            "suggestions": ["is"]
          }
        ]
      }
    ]
  }
}
```

## API Usage

### Enable/Disable Grammar Checking

Grammar checking can be controlled via the upload API:

```javascript
// Enable grammar checking (default)
const formData = new FormData();
formData.append('file', file);
formData.append('checkGrammar', 'true');

// Disable grammar checking (faster processing)
formData.append('checkGrammar', 'false');
```

### Metadata Response

The upload response includes grammar check statistics:

```json
{
  "session_id": "uuid",
  "questions": [...],
  "metadata": {
    // ... other metadata ...
    "grammar_check": {
      "enabled": true,
      "stats": {
        "total_questions": 50,
        "questions_checked": 50,
        "questions_with_errors": 3,
        "total_errors": 5,
        "error_rate": 6.0,
        "errors_by_question_type": {
          "multiple choice": 2,
          "true/false": 1
        },
        "errors_by_field": {
          "question": 4,
          "a": 1
        }
      }
    }
  }
}
```

## Frontend Integration

### Displaying Grammar Errors

```javascript
// Check if question has grammar errors
if (question.has_potential_grammar_error) {
  // Show warning badge or highlight
  showGrammarWarning(question);
}

// Access detailed error information
question.grammar_check.fields_with_errors.forEach(fieldError => {
  console.log(`Field '${fieldError.field}' has ${fieldError.error_count} errors`);
  fieldError.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
    console.log(`Suggestions: ${error.suggestions.join(', ')}`);
  });
});
```

### Summary Statistics

```javascript
// Display grammar check summary
const stats = metadata.grammar_check.stats;
if (stats.questions_with_errors > 0) {
  showNotification(`${stats.questions_with_errors} questions have potential grammar errors (${stats.error_rate}% error rate)`);
}
```

## Performance Considerations

- **Initial Setup**: First run downloads LanguageTool (~250MB) - subsequent runs are fast
- **Processing Time**: ~1-2 seconds per question for grammar checking
- **Optional**: Can be disabled for faster uploads when grammar checking isn't needed
- **Caching**: LanguageTool caches downloaded files for reuse

## Error Handling

The grammar checker is designed to be fault-tolerant:

- **Initialization Failures**: If LanguageTool fails to initialize, questions are processed without grammar checking
- **Processing Errors**: Individual question failures don't stop the entire batch
- **Graceful Degradation**: All questions get default grammar check fields even if checking fails

## Configuration

### Language Support

Currently configured for English (en-US), but can be extended:

```python
# In grammar_checker.py
checker = GrammarChecker(language='en-GB')  # British English
checker = GrammarChecker(language='de-DE')  # German
```

### Error Filtering

The grammar checker filters out some false positives:

- Whitespace-only errors
- Sentence fragment errors for short phrases (common in multiple choice options)
- Overly pedantic punctuation errors

## Troubleshooting

### Common Issues

1. **"Grammar checker not available"**: LanguageTool failed to initialize
   - Check internet connection for initial download
   - Verify disk space for cache (~300MB)

2. **Slow performance**: First run downloads LanguageTool
   - Subsequent runs are much faster
   - Consider disabling for large batches if not needed

3. **No errors detected**: Grammar checker might be too lenient
   - Check the error filtering logic
   - Some errors may be contextual and not caught

### Logs

Grammar checker activities are logged with prefixes:
- `[INFO]` for successful operations
- `[WARNING]` for non-critical issues  
- `[ERROR]` for failures

Check application logs for detailed error information.
