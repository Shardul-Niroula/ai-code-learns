
export type TabType = 'explainer' | 'words' | 'chat';

export interface Preference {
  id: string;
  label: string;
  instruction: string;
}

export interface SettingsState {
  selectedPreferences: string[];
}

export interface WordDefinition {
  id: string;
  word: string;
  definition: string;
  timestamp: number;
}

export const DAILY_QUOTA = 50;

export const DEFAULT_PREFERENCES: Preference[] = [
  { id: 'child', label: 'Explain like a child', instruction: 'Explain the concepts using simple analogies and very basic language, as if teaching a 10-year-old.' },
  { id: 'expert', label: 'Explain like an expert', instruction: 'Provide a deep technical dive, including performance implications, memory management, and advanced patterns.' },
  { id: 'short', label: 'Explain in short', instruction: 'Be extremely concise. Use bullet points and minimal text.' },
  { id: 'step', label: 'Step-by-step', instruction: 'Break down the code line-by-line and explain exactly what each part does in sequence.' },
  { id: 'humor', label: 'Add some humor', instruction: 'Use funny metaphors or lighthearted jokes to make the learning process more engaging.' },
];
