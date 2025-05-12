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
  pre_ans?: string;
}

export interface QuestionMetadata {
  year: string | null;
  date: string | null;
  exam_type: string;
  semester: string | null;
  lecturer: string;
  subject: string;
  program_type: string;
  department: string;
  selection_settings: {
    [key: string]: {
      count: number;
      categories?: string[];
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
}

export interface GenerateResponse {
  exam_url: string;
  key_url: string;
} 