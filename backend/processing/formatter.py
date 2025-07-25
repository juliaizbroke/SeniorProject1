# backend/processing/formatter.py (updated to support 'image' and 'is_long')

import os
import random
from docxtpl import DocxTemplate

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


def filter_and_randomize(questions, settings):
    import random
    
    selected = {
        "multiple choice": [],
        "true/false": [],
        "matching": [],
        "fake answer": [],
        "written question": []
    }
    
    # If there are no specific selection settings, include all questions
    if not settings:
        for qtype in selected:
            qset = [q for q in questions if q["type"] == qtype]
            selected[qtype].extend(qset)
        return selected
    
    # Group questions by type and category
    grouped = {}
    for qtype in selected:
        grouped[qtype] = {}
        for q in [q for q in questions if q["type"] == qtype]:
            category = q.get("category", "uncategorized")
            if category not in grouped[qtype]:
                grouped[qtype][category] = []
            grouped[qtype][category].append(q)
    
    # Apply selection settings for each question type and category
    for qtype, categories in settings.items():
        if qtype not in grouped:
            continue
            
        for category, count in categories.items():
            if category not in grouped[qtype]:
                continue
                
            # Get available questions for this category
            available = grouped[qtype][category]
            
            # Randomly select the requested number of questions (or all if fewer)
            selected_count = min(count, len(available))
            if selected_count > 0:
                selected_questions = random.sample(available, selected_count)
                selected[qtype].extend(selected_questions)
    
    # For any question type without specific settings, include all questions
    for qtype in selected:
        if qtype not in settings and grouped.get(qtype):
            for category_questions in grouped[qtype].values():
                selected[qtype].extend(category_questions)
    
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
        
    # For matching questions, we'll group them all into one matching exercise
    matching_questions = filtered.get("matching", [])
    fake_answer_questions = filtered.get("fake answer", [])
    matching_items_count = 0  # Track the actual number of matching items
    
    if matching_questions:
        # Extract all questions and correct answers from matching questions
        questions_list = []
        correct_answers_list = []
        
        for q in matching_questions:
            questions_list.append(q["question"])
            correct_answers_list.append(q["answer"])
        
        matching_items_count = len(questions_list)  # Set the count of matching items
        
        # Get fake answers from the fake answer questions passed from edit page
        fake_answers = []
        for q in fake_answer_questions:
            fake_answers.append(q["answer"])
        
        # Combine correct answers with fake answers for Column B
        all_column_b_options = correct_answers_list.copy()
        all_column_b_options.extend(fake_answers)
        
        # Shuffle all options (correct + fake) for column B
        random.shuffle(all_column_b_options)
        
        # Add a single matching question with all items
        match_questions.append({
            "no": 1,
            "question": "Match the following",
            "column_a": questions_list,  # All questions in column A
            "column_b": all_column_b_options  # All answers (correct + fake) shuffled in column B
        })
        
        # Create individual answer entries for each matching item
        # This format will support the template format: 1 b, 2 a, 3 c, etc.
        match_answers = []
        for i, original_answer in enumerate(correct_answers_list):
            answer_idx = all_column_b_options.index(original_answer)
            answer_letter = chr(65 + answer_idx).lower()  # Convert to lowercase letter (a, b, c, etc.)
            match_answers.append({"no": i+1, "ans": answer_letter})

    # ...existing code for written questions...

    # Step 3: Prepare context for rendering
    context = {
        "department": metadata.get("department", "AU"),
        **metadata,
        "mc_no": len(mc_questions),
        "tf_no": len(tf_questions),
        "match_no": matching_items_count,  # Use the count of matching items instead of len(match_questions)
        "sq_no": len(sq_questions),
        "lq_no": len(lq_questions),
        "total_no": len(mc_questions) + len(tf_questions) + matching_items_count + len(sq_questions) + len(lq_questions),
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