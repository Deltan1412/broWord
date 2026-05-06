export interface UserProfile {
  id: string;
  email: string | null;
  tokens_used: number;
  daily_token_limit: number;
  last_reset: string;
  created_at: string;
}

export interface WordEntry {
  word: string;
  simplified: string;
  definition: string;
}

export interface ProcessResult {
  words: WordEntry[];
  simplified_paragraph: string;
}

export interface ProcessResponse {
  result: ProcessResult;
  tokens_used: number;
  tokens_remaining: number;
}

export interface ProcessError {
  error: string;
}
