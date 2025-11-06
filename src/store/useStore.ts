import { create } from 'zustand';

interface TranscriptLine {
  text: string;
  timestamp?: string;
}

interface VideoThumbnail {
  url: string;
  videoId: string;
  platform: string;
  duration?: number;
}

interface AppState {
  // Video and transcript data
  videoUrl: string;
  transcript: TranscriptLine[];
  summary: string;
  selectedLanguage: string;
  thumbnail: VideoThumbnail | null;
  usageLogId: string | null;
  
  // UI states
  isLoading: boolean;
  isGeneratingSummary: boolean;
  error: string | null;
  showTimestamps: boolean;
  feedbackPromptOpen: boolean;
  feedbackPromptShown: boolean;
  
  // Actions
  setVideoUrl: (url: string) => void;
  setTranscript: (transcript: TranscriptLine[]) => void;
  setSummary: (summary: string) => void;
  setSelectedLanguage: (language: string) => void;
  setThumbnail: (thumbnail: VideoThumbnail | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGeneratingSummary: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setShowTimestamps: (show: boolean) => void;
  setUsageLogId: (id: string | null) => void;
  setFeedbackPromptOpen: (open: boolean) => void;
  setFeedbackPromptShown: (shown: boolean) => void;
  clearData: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  videoUrl: '',
  transcript: [],
  summary: '',
  selectedLanguage: 'en',
  thumbnail: null,
  usageLogId: null,
  isLoading: false,
  isGeneratingSummary: false,
  error: null,
  showTimestamps: true,
  feedbackPromptOpen: false,
  feedbackPromptShown: false,
  
  // Actions
  setVideoUrl: (url) => set({ videoUrl: url, error: null }),
  setTranscript: (transcript) => set({ transcript }),
  setSummary: (summary) => set({ summary }),
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),
  setThumbnail: (thumbnail) => set({ thumbnail }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsGeneratingSummary: (generating) => set({ isGeneratingSummary: generating }),
  setError: (error) => set({ error }),
  setShowTimestamps: (show) => set({ showTimestamps: show }),
  setUsageLogId: (id) => set({ usageLogId: id }),
  setFeedbackPromptOpen: (open) => set({ feedbackPromptOpen: open }),
  setFeedbackPromptShown: (shown) => set({ feedbackPromptShown: shown }),
  clearData: () => set({ 
    transcript: [], 
    summary: '', 
    thumbnail: null,
    usageLogId: null,
    feedbackPromptOpen: false,
    feedbackPromptShown: false,
    error: null,
    isLoading: false,
    isGeneratingSummary: false
  }),
}));

export type { TranscriptLine, VideoThumbnail };