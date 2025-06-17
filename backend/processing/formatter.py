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
        "matching": [],
        "written question": []
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
    sq_questions = []
    lq_questions = []

    mc_answers = []
    tf_answers = []
    match_answers = []
    sq_answers = []
    lq_answers = []

    # Set random seed based on current time to ensure different randomization each time
    random.seed()

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
        tf_answers.append({"no": i, "ans": q["answer"]})    # For matching questions, we'll group them all into one matching exercise
    matching_questions = filtered.get("matching", [])
    if matching_questions:
        # Extract all questions and answers
        questions_list = []
        answers_list = []
        
        for q in matching_questions:
            questions_list.append(q["question"])
            answers_list.append(q["answer"])
        
        # Create a copy of answers and shuffle them for column B
        shuffled_answers = answers_list.copy()
        random.shuffle(shuffled_answers)
        
        # Add a single matching question with all items
        match_questions.append({
            "no": 1,
            "question": "Match the following",
            "column_a": questions_list,  # All questions in column A
            "column_b": shuffled_answers  # All answers shuffled in column B
        })
        
        # Create answer key mapping
        answer_mapping = []
        for i, original_answer in enumerate(answers_list):
            answer_idx = shuffled_answers.index(original_answer)
            answer_mapping.append(f"{i+1}-{chr(65+answer_idx)}")
            
        match_answers.append({"no": 1, "ans": ", ".join(answer_mapping)})  # Store mapping as answer

    # Separate counters for short and long questions
    sq_counter = 1
    lq_counter = 1

    for q in filtered.get("written question", []):
        if q["q_type"] == "short":
            sq_questions.append({"no": sq_counter, "question": q["question"]})
            sq_answers.append({"no": sq_counter, "ans": q["answer"]})
            sq_counter += 1
        elif q["q_type"] == "long":
            lq_questions.append({"no": lq_counter, "question": q["question"]})
            lq_answers.append({"no": lq_counter, "ans": q["answer"]})
            lq_counter += 1

    # Step 3: Prepare context for rendering
    context = {
        "department": metadata.get("department", "AU"),
        **metadata,
        "mc_no": len(mc_questions),
        "tf_no": len(tf_questions),
        "match_no": len(match_questions),
        "sq_no": len(sq_questions),
        "lq_no": len(lq_questions),
        "total_no": len(mc_questions) + len(tf_questions) + len(match_questions) + len(sq_questions) + len(lq_questions),
        "percent": 100,
        "mcquestions": mc_questions,
        "tfquestions": tf_questions,
        "matchingquestions": match_questions,
        "shortquestions": sq_questions,
        "longquestions": lq_questions,
        "mcanswers": mc_answers,
        "tfanswers": tf_answers,
        "matchanswers": match_answers,
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