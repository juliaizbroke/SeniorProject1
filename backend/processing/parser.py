# backend/processing/parser.py (updated for new Excel format)

import pandas as pd
from io import BytesIO
import datetime

def parse_excel(file):
    xls = pd.ExcelFile(file)

    # ---- Extract Metadata from 'Info' ----
    info_sheet = xls.parse("Info", header=None)
    metadata = {
        "year": None,
        "date": None,
        "exam_type": "Midterm",  # default fallback
        "semester": None,
        "lecturer": "",
        "subject": "",
        "program_type": "Regular",
        "department": "AU"
    }
    for i in range(len(info_sheet)):  # Loop through rows
        row = info_sheet.iloc[i]
        for cell in row:
            if isinstance(cell, str):
                cell_l = cell.lower()
                if "year" in cell_l:
                    metadata["year"] = row[row[row == cell].index[0] + 1]
                elif "today" in cell_l or "date" in cell_l:
                    metadata["date"] = row[row[row == cell].index[0] + 1]
                elif "lecturer" in cell_l:
                    metadata["lecturer"] = row[row[row == cell].index[0] + 1]
                elif "subject" in cell_l:
                    metadata["subject"] = row[row[row == cell].index[0] + 1]
                elif "exam type" in cell_l:
                    metadata["exam_type"] = row[row[row == cell].index[0] + 1]
                elif "semester" in cell_l:
                    metadata["semester"] = row[row[row == cell].index[0] + 1]

    # ---- Extract Questions ----
    all_questions = []

    # Multiple Choice
    df_mc = xls.parse("MultipleChoice")
    for _, row in df_mc.iterrows():
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
            "image": row.get("myimage", ""),
            "is_long": bool(row.get("is_long", False))
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
        pre_ans = row.get("pre_ans", "")
        # Split the pre_ans by newline or semicolon to get individual choices
        choices = [choice.strip() for choice in pre_ans.replace('\n', ';').split(';') if choice.strip()]
        all_questions.append({
            "type": "matching",
            "question": row.get("question", ""),
            "answer": choices,  # Store as list of choices
            "category": row.get("category", "")
        })

    metadata["selection_settings"] = {}  # Optional: add default/random if needed
    return all_questions, metadata
