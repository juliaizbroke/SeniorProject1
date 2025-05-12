# backend/processing/formatter.py (updated to support 'image' and 'is_long')

import os
import random
from docxtpl import DocxTemplate

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


def filter_and_randomize(questions, settings):
    selected = {
        "multiple choice": [],
        "true/false": [],
        "matching": []
    }
    for qtype in selected:
        qset = [q for q in questions if q["type"] == qtype]
        selected[qtype].extend(qset)
    return selected


def generate_word_files(questions, metadata, session_id):
    # Step 1: Filter & randomize if needed
    filtered = filter_and_randomize(questions, metadata.get("selection_settings", {}))

    # Step 2: Format for Word templates
    mc_questions = []
    tf_questions = []
    match_questions = []

    mc_answers = []
    tf_answers = []
    match_answers = []

    for i, q in enumerate(filtered.get("multiple choice", []), 1):
        mc_questions.append({
            "no": i,
            "question": q["question"],
            "a": q["a"],
            "b": q["b"],
            "c": q["c"],
            "d": q["d"],
            "e": q["e"],
            "image": q.get("image", ""),
            "long": q.get("is_long", False)
        })
        mc_answers.append({"no": i, "ans": q["answer"]})

    for i, q in enumerate(filtered.get("true/false", []), 1):
        tf_questions.append({"no": i, "question": q["question"]})
        tf_answers.append({"no": i, "ans": q["answer"]})

    for i, q in enumerate(filtered.get("matching", []), 1):
        match_questions.append({"no": i, "question": q["question"]})
        match_answers.append({"no": i, "ans": q["answer"]})

    # Step 3: Prepare context for rendering
    context = {
        "department": metadata.get("department", "AU"),
        **metadata,
        "mc_no": len(mc_questions),
        "tf_no": len(tf_questions),
        "match_no": len(match_questions),
        "total_no": len(mc_questions) + len(tf_questions) + len(match_questions),
        "percent": 100,
        "mcquestions": mc_questions,
        "tfquestions": tf_questions,
        "matchingquestions": match_questions,
    }

    # Step 4: Render Word files
    exam_tpl = DocxTemplate(os.path.join(TEMPLATE_DIR, "exam-paper-tpl_clean.docx"))
    answer_tpl = DocxTemplate(os.path.join(TEMPLATE_DIR, "exam-answerkey-tpl_clean.docx"))

    exam_path = os.path.join(OUTPUT_DIR, f"exam_{session_id}.docx")
    key_path = os.path.join(OUTPUT_DIR, f"answerkey_{session_id}.docx")

    exam_tpl.render(context)
    exam_tpl.save(exam_path)

    answer_tpl.render(context)
    answer_tpl.save(key_path)

    return exam_path, key_path