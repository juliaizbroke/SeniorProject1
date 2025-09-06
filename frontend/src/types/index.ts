export interface Question {
  type: string;
  question: string;
  answer: string;
  category: string;
  // Multiple choice specific fields
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  is_long?: boolean;
  image?: string;
  // New image handling fields
  image_description?: string;  // Description from Excel
  uploaded_image_file?: File | null;
  uploaded_image_url?: string;  // URL for frontend display
  uploaded_image_filename?: string;  // Filename on server
  has_uploaded_image?: boolean;
  // True/False specific fields
  // Matching specific fields
  // Written answer specific fields
  q_type?: string;
  // Duplicate metadata (annotated by backend)
  is_duplicate?: boolean;
  duplicate_group_id?: number;
  duplicate_representative?: boolean;
  duplicate_similarity?: number;
  // Grammar metadata (annotated by backend)
  has_grammar_issues?: boolean;
  grammar_issue_count?: number;
  grammar_issues?: Array<{
    field: 'question' | 'answer';
    issues: Array<GrammarIssueDetail>;
  }>;
}

export interface GrammarIssueDetail {
  message: string;
  ruleId?: string;
  offset?: number;
  length?: number;
  context?: { text?: string; offset?: number; length?: number } | null;
  replacements?: string[];
}

export interface QuestionMetadata {
  year: string;
  semester: string;
  exam_type: string;
  exam_type_code: string;
  department: string;
  program_type: string;
  subject_code: string;
  subject_name: string;
  lecturer: string;
  date: string;
  time: string;
  // Optional grammar summary from backend
  grammar_check?: {
    enabled: boolean;
    lang?: string;
    questions_with_issues?: number;
    total_issues?: number;
    error?: string;
    reason?: string;
  };
  selection_settings: {
    [questionType: string]: {
      [category: string]: number;
    };
  };
}

export interface ExamMetadata {
  subject: string;
  lecturer: string;
  date: string;
  duration: string;
  instructions: string;
}

export interface SelectionSettings {
  [category: string]: {
    [type: string]: number;
  };
}

export interface UploadResponse {
  session_id: string;
  questions: Question[];
  metadata: QuestionMetadata;
}

export interface GenerateRequest {
  session_id: string;
  questions: Question[];
  metadata: QuestionMetadata;
  filters?: {
    types?: string[];
    categories?: string[];
  };
  shuffledMatchingOrder?: {
    allAnswers: string[];
    correctAnswers: string[];
    fakeAnswers: string[];
  } | null;
}

export interface GenerateResponse {
  exam_url: string;
  key_url: string;
  exam_preview_url?: string;
  key_preview_url?: string;
  expires_in_minutes: number;
}