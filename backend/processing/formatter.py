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
        tf_answers.append({"no": i, "ans": q["answer"]})

    for i, q in enumerate(filtered.get("matching", []), 1):
        # Get the choices and create a randomized version for column B
        choices = q["answer"] if isinstance(q["answer"], list) else [q["answer"]]
        # Create a new list with indices and shuffle them
        indices = list(range(len(choices)))
        random.shuffle(indices)
        randomized_choices = [choices[i] for i in indices]
        
        match_questions.append({
            "no": i,
            "question": q["question"],
            "column_a": choices,  # Original order for column A
            "column_b": randomized_choices  # Randomized order for column B
        })
        match_answers.append({"no": i, "ans": ", ".join(choices)})  # Store original order as answer

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
        "sqanswers": sq_answers,
        "lqanswers": lq_answers,
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