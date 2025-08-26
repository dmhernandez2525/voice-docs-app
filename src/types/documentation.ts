export interface DocumentationSubsection {
  id: string;
  title: string;
  content: string | Record<string, unknown>;
  tags?: string[];
  links?: Array<{
    title: string;
    url: string;
    type: 'internal' | 'external';
  }>;
}

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  subsections: DocumentationSubsection[];
}

export interface DirectAnswer {
  answer: string;
  confidence: number;
  sources: DocumentationSubsection[];
  followUpQuestions: string[];
  actionableSteps?: string[];
}

export interface AIResponse {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  links?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'external' | 'generated';
  }>;
}
