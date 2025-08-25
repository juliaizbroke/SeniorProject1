# backend/processing/parser.py (updated for new Excel format)

import pandas as pd
from io import BytesIO
import datetime
from .duplicate_detector import QuestionDuplicateDetector
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

def parse_excel(file, remove_duplicates=True, similarity_threshold=0.8):
    """
    Parse Excel file and extract questions with optional duplicate detection.
    
    Args:
        file: Excel file object
        remove_duplicates: Whether to remove duplicate questions
        similarity_threshold: Threshold for similarity detection (0.0-1.0)
    """
    xls = pd.ExcelFile(file)

    # ---- Extract Metadata from 'Info' ----
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
    for idx, row in df_mc.iterrows():
        # Check if any option has length >= 20
        options = [str(row.get(opt, "")) for opt in ['a', 'b', 'c', 'd', 'e']]
        is_long = any(len(opt) >= 20 for opt in options)
        
       
        all_questions.append({
            "type": "multiple choice",
            "question": row.get("question", ""),
            "a": row.get("a", ""),
            "b": row.get("b", ""),
            "c": row.get("c", ""),
            "d": row.get("d", ""),
            "e": row.get("e", ""),
            "answer": row.get("ans", ""),
            "category": row.get("category", ""),
            "is_long": is_long
        })

    # True/False
    df_tf = xls.parse("TrueFalse")
    for _, row in df_tf.iterrows():
        all_questions.append({
            "type": "true/false",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "category": row.get("category", "")
        })

    # Matching
    df_match = xls.parse("Matching")
    for _, row in df_match.iterrows():
       all_questions.append({
            "type": "matching",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "category": row.get("category", "")
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
        all_questions.append({
            "type": "written question",
            "question": row.get("question", ""),
            "answer": row.get("ans", ""),
            "q_type": row.get("q_type", ""),
            "category": row.get("category", "")
        })

    # ---- Apply Duplicate Detection ----
    if remove_duplicates and all_questions:
        try:
            detector = QuestionDuplicateDetector(similarity_threshold=similarity_threshold)
            original_count = len(all_questions)
            all_questions, removed_duplicates = detector.remove_duplicates(all_questions)
            
            # Log the duplicate detection results
            logging.info(f"Duplicate detection: {original_count} -> {len(all_questions)} questions "
                        f"({len(removed_duplicates)} duplicates removed)")
            
            # Add duplicate detection info to metadata
            metadata["duplicate_detection"] = {
                "enabled": True,
                "original_count": original_count,
                "final_count": len(all_questions),
                "removed_count": len(removed_duplicates),
                "similarity_threshold": similarity_threshold,
                "removed_duplicates": removed_duplicates
            }
        except Exception as e:
            logging.error(f"Duplicate detection failed: {str(e)}")
            metadata["duplicate_detection"] = {
                "enabled": False,
                "error": str(e)
            }

    metadata["selection_settings"] = {}  # Optional: add default/random if needed
    return all_questions, metadata
