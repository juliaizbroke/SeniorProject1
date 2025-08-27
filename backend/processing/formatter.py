# backend/processing/formatter.py (updated to support 'image' and 'is_long')

import os
import random
from docxtpl import DocxTemplate, InlineImage, RichText
from docx.shared import Mm
from docx import Document
from docx.enum.text import WD_BREAK

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

def generate_word_files(questions, metadata, session_id, selected_template="default", shuffled_matching_order=None, selected_word_template="default"):
    print(f"[DEBUG] generate_word_files called with {len(questions)} questions")
    print(f"[DEBUG] Question types: {[q.get('type', 'unknown') for q in questions]}")
    print(f"[DEBUG] Selected Word template: {selected_word_template}")
    
    # Step 1: Filter & randomize if needed
    filtered = filter_and_randomize(questions, metadata.get("selection_settings", {}))
    
    print(f"[DEBUG] After filtering:")
    for qtype, qlist in filtered.items():
        print(f"[DEBUG]   {qtype}: {len(qlist)} questions")

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
    
    # Determine which template to use for images - use the same logic as for main template
    WORD_TEMPLATES_FOLDER = os.path.join(TEMPLATE_DIR, "paper")
    
    if selected_word_template == "default" or not selected_word_template:
        # Check if there's a default.txt file that specifies the default template
        default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
        if os.path.exists(default_file_path):
            with open(default_file_path, 'r') as f:
                default_template_name = f.read().strip()
            template_for_images = os.path.join(WORD_TEMPLATES_FOLDER, default_template_name)
            
            # If the default template file doesn't exist, fall back to original
            if not os.path.exists(template_for_images):
                template_for_images = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
        else:
            # No default.txt file, use original template
            template_for_images = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
    else:
        # Use the specifically selected template
        template_for_images = os.path.join(WORD_TEMPLATES_FOLDER, selected_word_template)
        
        # If the selected template doesn't exist, fall back to default
        if not os.path.exists(template_for_images):
            template_for_images = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
    
    for i, q in enumerate(filtered.get("multiple choice", []), 1):
        image_obj = None
        print(f"[DEBUG] MCQ {i} image field: {q.get('image')}")
        if q.get("image") and q.get("image") not in ["#VALUE!", "", "N/A", None]:
            image_path = os.path.join(TEMPLATE_DIR, q["image"]) if not os.path.isabs(q["image"]) else q["image"]
            print(f"[DEBUG] MCQ {i} resolved image_path: {image_path}")
            if os.path.exists(image_path) and os.path.isfile(image_path):
                try:
                    image_obj = InlineImage(DocxTemplate(template_for_images), image_path, width=Mm(30))
                    print(f"[DEBUG] MCQ {i} image loaded successfully")
                except Exception as e:
                    print(f"[DEBUG] MCQ {i} failed to load image: {e}")
            else:
                print(f"[DEBUG] MCQ {i} image file does not exist: {image_path}")
        else:
            print(f"[DEBUG] MCQ {i} skipping invalid/empty image field")
        mc_questions.append({
            "no": i,
            "question": q["question"],
            "a": q["a"],
            "b": q["b"],
            "c": q["c"],
            "d": q["d"],
            "e": q["e"],
            "image": image_obj,
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
    
    if matching_questions and len(matching_questions) > 0:
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
            # Only include fake answers that are not empty, None, or just whitespace
            if q.get("answer") and str(q["answer"]).strip():
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
    else:
        # Ensure empty lists when no matching questions exist
        match_questions = []
        match_answers = []
        matching_items_count = 0

    # Process written questions - separate into short and long based on q_type
    sq_counter = 1
    lq_counter = 1
    
    print(f"[DEBUG] Processing {len(filtered.get('written question', []))} written questions")
    
    for q in filtered.get("written question", []):
        q_type = q.get("q_type", "").lower().strip()
        print(f"[DEBUG] Written question q_type: '{q_type}' | question: '{q['question'][:50]}...'")
        
        # Determine if it's a short or long question based on q_type
        if q_type == "short":
            question_data = {
                "no": sq_counter,
                "question": q["question"],
                "category": q.get("category", "")
            }
            answer_data = {
                "no": sq_counter,
                "ans": q["answer"]
            }
            sq_questions.append(question_data)
            sq_answers.append(answer_data)
            sq_counter += 1
            print(f"[DEBUG] Added as short question #{sq_counter-1}")
        elif q_type == "long":
            question_data = {
                "no": lq_counter,
                "question": q["question"],
                "category": q.get("category", "")
            }
            answer_data = {
                "no": lq_counter,
                "ans": q["answer"]
            }
            lq_questions.append(question_data)
            lq_answers.append(answer_data)
            lq_counter += 1
            print(f"[DEBUG] Added as long question #{lq_counter-1}")
        else:
            # Default behavior: if q_type is not specified, treat as short question
            question_data = {
                "no": sq_counter,
                "question": q["question"],
                "category": q.get("category", "")
            }
            answer_data = {
                "no": sq_counter,
                "ans": q["answer"]
            }
            sq_questions.append(question_data)
            sq_answers.append(answer_data)
            sq_counter += 1
            print(f"[DEBUG] Added as short question (default) #{sq_counter-1}")
    
    print(f"[DEBUG] Final counts - Short: {len(sq_questions)}, Long: {len(lq_questions)}")
    print(f"[DEBUG] Section counts - MC: {len(mc_questions)}, TF: {len(tf_questions)}, Match: {matching_items_count}, SQ: {len(sq_questions)}, LQ: {len(lq_questions)}")

    # Calculate part numbers dynamically based on which sections have content
    part_counter = 1
    part_numbers = {}
    roman_numerals = ['I', 'II', 'III', 'IV', 'V']
    
    # Initialize all part variables with empty strings first
    part_numbers['mc_part'] = ''
    part_numbers['tf_part'] = ''
    part_numbers['match_part'] = ''
    part_numbers['sq_part'] = ''
    part_numbers['lq_part'] = ''
    part_numbers['has_mc'] = False
    part_numbers['has_tf'] = False
    part_numbers['has_match'] = False
    part_numbers['has_sq'] = False
    part_numbers['has_lq'] = False
    
    # Now assign part numbers only to sections that exist
    if len(mc_questions) > 0:
        part_numbers['mc_part'] = roman_numerals[part_counter - 1]
        part_numbers['has_mc'] = True
        part_counter += 1
    
    if len(tf_questions) > 0:
        part_numbers['tf_part'] = roman_numerals[part_counter - 1]
        part_numbers['has_tf'] = True
        part_counter += 1
    
    if matching_items_count > 0:
        part_numbers['match_part'] = roman_numerals[part_counter - 1]
        part_numbers['has_match'] = True
        part_counter += 1
    
    if len(sq_questions) > 0:
        part_numbers['sq_part'] = roman_numerals[part_counter - 1]
        part_numbers['has_sq'] = True
        part_counter += 1
    
    if len(lq_questions) > 0:
        part_numbers['lq_part'] = roman_numerals[part_counter - 1]
        part_numbers['has_lq'] = True
        part_counter += 1
    
    # Calculate next part numbers for "Continue to Part X" messages
    sections = []
    if part_numbers['has_mc']:
        sections.append(('mc', part_numbers['mc_part']))
    if part_numbers['has_tf']:
        sections.append(('tf', part_numbers['tf_part']))
    if part_numbers['has_match']:
        sections.append(('match', part_numbers['match_part']))
    if part_numbers['has_sq']:
        sections.append(('sq', part_numbers['sq_part']))
    if part_numbers['has_lq']:
        sections.append(('lq', part_numbers['lq_part']))
    
    # Set "next part" variables
    for i, (section_type, part_num) in enumerate(sections):
        if i < len(sections) - 1:  # Not the last section
            next_section_type, next_part_num = sections[i + 1]
            part_numbers[f'next_after_{section_type}'] = next_part_num
    
    print(f"[DEBUG] Part numbers assigned: {part_numbers}")

    # Step 3: Prepare context for rendering
    context = {
        "department": metadata.get("department", "AU"),
        **metadata,
        **part_numbers,  # Add dynamic part numbers
        "exam_metadata": metadata,  # Add exam_metadata for template compatibility
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
    
    # Try different page break methods
    try:
        # Method 1: RichText with page break
        page_break_obj = RichText()
        page_break_obj.add('', break_=WD_BREAK.PAGE)
        context["page_break"] = page_break_obj
        print("[DEBUG] Using RichText page break")
    except Exception as e:
        print(f"[DEBUG] RichText page break failed: {e}")
        # Method 2: Use form feed character as fallback
        context["page_break"] = "\f"
        print("[DEBUG] Using form feed character for page break")
    
    print(f"[DEBUG] Context variables: {list(context.keys())}")

    # Step 4: Render Word files
    # Determine which Word template to use
    WORD_TEMPLATES_FOLDER = os.path.join(TEMPLATE_DIR, "paper")
    
    if selected_word_template == "default" or not selected_word_template:
        # Check if there's a default.txt file that specifies the default template
        default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
        if os.path.exists(default_file_path):
            with open(default_file_path, 'r') as f:
                default_template_name = f.read().strip()
            exam_template_path = os.path.join(WORD_TEMPLATES_FOLDER, default_template_name)
            
            # If the default template file doesn't exist, fall back to original
            if not os.path.exists(exam_template_path):
                exam_template_path = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
                print(f"[WARNING] Default template {default_template_name} not found, using original")
        else:
            # No default.txt file, use original template
            exam_template_path = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
    else:
        # Use the specifically selected template
        exam_template_path = os.path.join(WORD_TEMPLATES_FOLDER, selected_word_template)
        
        # If the selected template doesn't exist, fall back to default
        if not os.path.exists(exam_template_path):
            # Try to read default from default.txt
            default_file_path = os.path.join(WORD_TEMPLATES_FOLDER, "default.txt")
            if os.path.exists(default_file_path):
                with open(default_file_path, 'r') as f:
                    default_template_name = f.read().strip()
                exam_template_path = os.path.join(WORD_TEMPLATES_FOLDER, default_template_name)
                print(f"[WARNING] Selected Word template {selected_word_template} not found, using default {default_template_name}")
                
                if not os.path.exists(exam_template_path):
                    exam_template_path = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
                    print(f"[WARNING] Default template {default_template_name} also not found, using original")
            else:
                exam_template_path = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
                print(f"[WARNING] Selected Word template {selected_word_template} not found and no default.txt, using original")
    
    print(f"[DEBUG] Using Word template: {exam_template_path}")
    
    exam_tpl = DocxTemplate(exam_template_path)
    answer_tpl = DocxTemplate(os.path.join(TEMPLATE_DIR, "answerkey", "exam-answerkey-tpl_clean.docx"))

    exam_path = os.path.join(OUTPUT_DIR, f"exam_{session_id}.docx")
    key_path = os.path.join(OUTPUT_DIR, f"answerkey_{session_id}.docx")

    print(f"[DEBUG] Using exam template: {exam_template_path}")
    print(f"[DEBUG] Context keys: {list(context.keys())}")
    
    try:
        exam_tpl.render(context)
        exam_tpl.save(exam_path)
        print(f"[DEBUG] Exam file saved successfully: {exam_path}")
    except Exception as e:
        print(f"[ERROR] Failed to render exam template: {e}")
        # Try with the default template as fallback
        print(f"[DEBUG] Falling back to default template")
        default_template_path = os.path.join(TEMPLATE_DIR, "paper", "exam-paper-tpl_clean.docx")
        exam_tpl = DocxTemplate(default_template_path)
        exam_tpl.render(context)
        exam_tpl.save(exam_path)
        print(f"[DEBUG] Exam file saved with default template: {exam_path}")

    answer_tpl.render(context)
    answer_tpl.save(key_path)

    return exam_path, key_path