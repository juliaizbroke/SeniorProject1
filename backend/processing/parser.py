# backend/processing/parser.py (updated for new Excel format)

import pandas as pd
from io import BytesIO
import datetime
import os
from .duplicate_detector import QuestionDuplicateDetector, annotate_duplicates_in_questions
from .grammar_checker import check_questions_grammar
import logging

def format_date(date_str):
    try:
        # Parse the date string
        date_obj = pd.to_datetime(date_str)
        # Format the date with ordinal suffix
        day = date_obj.day
        suffix = 'th' if 11 <= day <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
        return f"{day}{suffix} {date_obj.strftime('%B %Y')}"
    except:
        return date_str

def format_time(time_str):
    try:
        # Parse the time string
        time_obj = datetime.datetime.strptime(time_str, '%H:%M:%S')
        # Format in 12-hour format with AM/PM
        return time_obj.strftime('%I:%M %p')
    except:
        return time_str

def parse_excel(file, remove_duplicates=False, similarity_threshold=0.8, check_grammar=True):
    """
    Parse Excel file and extract questions with optional duplicate detection and grammar checking.
    
    Args:
        file: Excel file object
        remove_duplicates: Whether to remove duplicate questions
        similarity_threshold: Threshold for similarity detection (0.0-1.0)
        check_grammar: Whether to perform grammar checking on questions
    """
    print(f"[DEBUG] parse_excel started")
    
    # Check if ML features should be disabled via environment variable
    import os
    disable_ml_features = os.environ.get('DISABLE_ML_FEATURES', 'false').lower() == 'true'
    print(f"[DEBUG] Environment check - DISABLE_ML_FEATURES={os.environ.get('DISABLE_ML_FEATURES', 'not_set')}")
    print(f"[DEBUG] Computed disable_ml_features={disable_ml_features}")
    
    if disable_ml_features:
        print(f"[INFO] ML features disabled via environment variable")
        remove_duplicates = False  # Force disable duplicate detection
        check_grammar = False      # Force disable grammar checking
    
    xls = pd.ExcelFile(file)
    print(f"[DEBUG] Excel file loaded, sheets: {xls.sheet_names}")

    # ---- Extract Metadata from 'Info' ----
    print(f"[DEBUG] Starting metadata extraction")
    info_sheet = xls.parse("Info", header=None)
    metadata = {
        "year": "",
        "semester": "",
        "exam_type": "",
        "department": "",
        "program_type": "",
        "subject_code": "",
        "subject_name": "",
        "lecturer": "",
        "date": "",
        "time": "",
        "exam_type_code": ""
    }

    for i in range(len(info_sheet)):
        row = info_sheet.iloc[i]
        for cell in row:
            if isinstance(cell, str):
                cell_l = cell.lower()
                if "year" in cell_l:
                    metadata["year"] = str(row[row[row == cell].index[0] + 1])
                elif "semester" in cell_l:
                    metadata["semester"] = str(row[row[row == cell].index[0] + 1])
                elif "exam type" in cell_l:
                    metadata["exam_type"] = str(row[row[row == cell].index[0] + 1])
                elif "department" in cell_l:
                    metadata["department"] = str(row[row[row == cell].index[0] + 1])
                elif "program type" in cell_l:
                    metadata["program_type"] = str(row[row[row == cell].index[0] + 1])
                elif "subject code" in cell_l:
                    metadata["subject_code"] = str(row[row[row == cell].index[0] + 1])
                elif "subject name" in cell_l:
                    metadata["subject_name"] = str(row[row[row == cell].index[0] + 1])
                elif "lecturer" in cell_l:
                    metadata["lecturer"] = str(row[row[row == cell].index[0] + 1])
                elif "date" in cell_l:
                    metadata["date"] = format_date(str(row[row[row == cell].index[0] + 1]))
                elif "time" in cell_l:
                    time_start = format_time(str(row[row[row == cell].index[0] + 1]))
                    time_end = format_time(str(row[row[row == cell].index[0] + 2]))
                    metadata["time"] = f"{time_start} - {time_end}"

    # Construct exam_type_code after all fields are populated
    metadata["exam_type_code"] = f"{metadata['exam_type']}_{metadata['semester']}/{metadata['year']}"

    # ---- Extract Questions ----
    all_questions = []

    # Multiple Choice
    df_mc = xls.parse("MultipleChoice")
    for i, row in enumerate(df_mc.itertuples(index=False), 2):  # DataFrame is 0-based, Excel is 1-based, skip header
        # Check if any option has length >= 20
        options = [str(getattr(row, opt, "")) for opt in ['a', 'b', 'c', 'd', 'e']]
        is_long = any(len(opt) >= 20 for opt in options)
        
        # Extract image description if present
        image_description = ""
        if hasattr(row, 'image') and row.image:
            image_description = str(row.image).strip()
        
        all_questions.append({
            "type": "multiple choice",
            "question": getattr(row, "question", ""),
            "a": getattr(row, "a", ""),
            "b": getattr(row, "b", ""),
            "c": getattr(row, "c", ""),
            "d": getattr(row, "d", ""),
            "e": getattr(row, "e", ""),
            "answer": getattr(row, "ans", ""),
            "category": getattr(row, "category", ""),
            "image_description": image_description,
            "is_long": is_long
        })

    # True/False
    df_tf = xls.parse("TrueFalse")
    for _, row in df_tf.iterrows():
        # Extract image description if present
        image_description = ""
        if 'image' in row and row['image'] and pd.notna(row['image']):
            image_description = str(row['image']).strip()
            
        all_questions.append({
            "type": "true/false",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "category": row.get("category", ""),
            "image_description": image_description
        })

    # Matching
    df_match = xls.parse("Matching")
    for _, row in df_match.iterrows():
        # Extract image description if present
        image_description = ""
        if 'image' in row and row['image'] and pd.notna(row['image']):
            image_description = str(row['image']).strip()
            
        all_questions.append({
            "type": "matching",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "category": row.get("category", ""),
            "image_description": image_description
        })

    # Fake Answers (for matching questions distractors)
    try:
        df_fake = xls.parse("FakeAnswers")
        for _, row in df_fake.iterrows():
            all_questions.append({
                "type": "fake answer",
                "question": row.get("question", ""),
                "answer": row.get("ans", ""),
                "category": row.get("category", "")
            })
    except Exception:
        # If FakeAnswers sheet doesn't exist, skip it
        pass

    # Written Question
    df_written = xls.parse("WrittenQuestion")
    for _, row in df_written.iterrows():
        # Extract image description if present
        image_description = ""
        if 'image' in row and row['image'] and pd.notna(row['image']):
            image_description = str(row['image']).strip()
            
        all_questions.append({
            "type": "written question",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "q_type": row.get("q_type", ""),
            "category": row.get("category", ""),
            "image_description": image_description
        })

    # ---- Apply Duplicate Detection ----
    print(f"[DEBUG] Starting duplicate detection phase")
    if all_questions and not disable_ml_features:
        try:
            print(f"[DEBUG] Creating QuestionDuplicateDetector with threshold {similarity_threshold}")
            
            import threading
            import time
            
            # Create a result container for duplicate detection
            dup_result_container = {'result': None, 'error': None, 'completed': False}
            
            def duplicate_detection_worker():
                try:
                    detector = QuestionDuplicateDetector(similarity_threshold=similarity_threshold)
                    print(f"[DEBUG] Detector created, processing {len(all_questions)} questions")
                    original_count = len(all_questions)
                    if remove_duplicates:
                        questions, removed_duplicates = detector.remove_duplicates(all_questions)
                        result = (questions, removed_duplicates, original_count, "remove")
                    else:
                        questions, duplicate_info = detector.annotate_duplicates(all_questions)
                        result = (questions, duplicate_info, original_count, "annotate")
                    dup_result_container['result'] = result
                    dup_result_container['completed'] = True
                except Exception as e:
                    dup_result_container['error'] = e
                    dup_result_container['completed'] = True
            
            # Start duplicate detection in a separate thread
            dup_thread = threading.Thread(target=duplicate_detection_worker)
            dup_thread.daemon = True
            dup_thread.start()
            
            # Wait for completion with timeout (2 minutes)
            dup_timeout_seconds = 120
            dup_start_time = time.time()
            
            while dup_thread.is_alive() and (time.time() - dup_start_time) < dup_timeout_seconds:
                time.sleep(1)
                elapsed = int(time.time() - dup_start_time)
                if elapsed % 20 == 0:  # Log every 20 seconds
                    print(f"[DEBUG] Duplicate detection in progress... {elapsed}/{dup_timeout_seconds}s")
            
            if dup_result_container['completed']:
                if dup_result_container['error']:
                    raise dup_result_container['error']
                
                questions, extra_data, original_count, mode = dup_result_container['result']
                all_questions = questions
                
                if mode == "remove":
                    removed_duplicates = extra_data
                    logging.info(f"Duplicate detection (removal): {original_count} -> {len(all_questions)} questions "
                                 f"({len(removed_duplicates)} duplicates removed)")
                    metadata["duplicate_detection"] = {
                        "enabled": True,
                        "mode": "remove",
                        "original_count": original_count,
                        "final_count": len(all_questions),
                        "removed_count": len(removed_duplicates),
                        "similarity_threshold": similarity_threshold,
                        "removed_duplicates": removed_duplicates
                    }
                else:
                    duplicate_info = extra_data
                    logging.info(f"Duplicate detection (annotate): {duplicate_info['group_count']} duplicate groups; "
                                 f"{duplicate_info['duplicate_question_count']} questions involved")
                    metadata["duplicate_detection"] = {
                        "enabled": True,
                        "mode": "annotate",
                        "original_count": original_count,
                        "final_count": len(all_questions),
                        "removed_count": 0,
                        "similarity_threshold": similarity_threshold,
                        "duplicate_groups": duplicate_info
                    }
            else:
                # Timeout occurred
                print(f"[WARNING] Duplicate detection timed out after {dup_timeout_seconds} seconds")
                raise Exception(f"Duplicate detection timed out after {dup_timeout_seconds} seconds")
                
        except Exception as e:
            logging.error(f"Duplicate detection failed: {str(e)}")
            print(f"[DEBUG] Duplicate detection failed with error: {str(e)}")
            metadata["duplicate_detection"] = {
                "enabled": False,
                "error": str(e)
            }
    else:
        reason = "ML features disabled via environment" if disable_ml_features else "No questions to process"
        print(f"[DEBUG] SKIPPING duplicate detection - {reason}")
        metadata["duplicate_detection"] = {
            "enabled": False,
            "reason": reason
        }

    # ---- Apply Grammar Checking ----
    print(f"[DEBUG] Starting grammar checking phase, check_grammar={check_grammar}")
    if all_questions and check_grammar and not disable_ml_features:
        try:
            print(f"[DEBUG] About to call check_questions_grammar with {len(all_questions)} questions")
            print(f"[DEBUG] Setting 3-minute timeout for grammar checking...")
            
            import threading
            import time
            
            # Create a result container
            result_container = {'result': None, 'error': None, 'completed': False}
            
            def grammar_check_worker():
                try:
                    logging.info("Starting grammar check on all questions...")
                    result = check_questions_grammar(all_questions)
                    result_container['result'] = result
                    result_container['completed'] = True
                except Exception as e:
                    result_container['error'] = e
                    result_container['completed'] = True
            
            # Start grammar checking in a separate thread
            thread = threading.Thread(target=grammar_check_worker)
            thread.daemon = True
            thread.start()
            
            # Wait for completion with timeout (3 minutes)
            timeout_seconds = 180
            start_time = time.time()
            
            while thread.is_alive() and (time.time() - start_time) < timeout_seconds:
                time.sleep(1)
                elapsed = int(time.time() - start_time)
                if elapsed % 30 == 0:  # Log every 30 seconds
                    print(f"[DEBUG] Grammar checking in progress... {elapsed}/{timeout_seconds}s")
            
            if result_container['completed']:
                if result_container['error']:
                    raise result_container['error']
                
                all_questions, grammar_stats = result_container['result']
                print(f"[DEBUG] Grammar check completed successfully")
                logging.info(f"Grammar check completed: {grammar_stats['questions_with_errors']}/{grammar_stats['total_questions']} questions have potential grammar errors")
                metadata["grammar_check"] = {
                    "enabled": True,
                    "stats": grammar_stats
                }
            else:
                # Timeout occurred
                print(f"[WARNING] Grammar checking timed out after {timeout_seconds} seconds")
                raise Exception(f"Grammar checking timed out after {timeout_seconds} seconds - likely model download/initialization issue")
                
        except Exception as e:
            logging.error(f"Grammar checking failed: {str(e)}")
            print(f"[DEBUG] Grammar check failed with error: {str(e)}")
            metadata["grammar_check"] = {
                "enabled": False,
                "error": str(e)
            }
            # Add default grammar check fields to questions if grammar check failed
            for question in all_questions:
                question['grammar_check'] = {
                    'checked': False,
                    'error': 'Grammar checker failed to initialize'
                }
                question['has_potential_grammar_error'] = False
                question['has_grammar_issues'] = False
                question['grammar_issue_count'] = 0
                question['grammar_issues'] = []
    else:
        reason = ("ML features disabled via environment" if disable_ml_features else
                 "Grammar checking disabled" if not check_grammar else 
                 "No questions to check")
        print(f"[DEBUG] SKIPPING grammar checking - {reason}")
        metadata["grammar_check"] = {
            "enabled": False,
            "reason": reason
        }
        # Add default grammar check fields to questions when grammar checking is disabled
        for question in all_questions:
            question['grammar_check'] = {
                'checked': False,
                'error': f'Grammar checking disabled: {reason}'
            }
            question['has_potential_grammar_error'] = False
            question['has_grammar_issues'] = False
            question['grammar_issue_count'] = 0
            question['grammar_issues'] = []
        metadata["grammar_check"] = {
            "enabled": False,
            "reason": "Grammar checking disabled" if not check_grammar else "No questions to check"
        }
        # Add default grammar check fields to questions when grammar checking is disabled
        for question in all_questions:
            question['grammar_check'] = {
                'checked': False,
                'error': 'Grammar checking disabled'
            }
            question['has_potential_grammar_error'] = False
            question['has_grammar_issues'] = False
            question['grammar_issue_count'] = 0
            question['grammar_issues'] = []

    metadata["selection_settings"] = {}  # Optional: add default/random if needed
    return all_questions, metadata
