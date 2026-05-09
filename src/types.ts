export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
}

export interface PracticeQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  type: 'mcq' | 'theory' | 'fill-in-the-gap';
}

export interface StudyMaterial {
  id: string;
  userId: string;
  fileName: string;
  originalContent: string;
  summary: string;
  mnemonics: string[];
  keyPoints: string[];
  practiceQuestions: PracticeQuestion[];
  course?: string;
  createdAt: any;
}
