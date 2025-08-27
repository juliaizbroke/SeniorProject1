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
  // True/False specific fields
  // Matching specific fields
  // Written answer specific fields
  q_type?: string;
  // Duplicate metadata (annotated by backend)
  is_duplicate?: boolean;
  duplicate_group_id?: number;
  duplicate_representative?: boolean;
  duplicate_similarity?: number;
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