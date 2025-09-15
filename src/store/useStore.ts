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
  
  // UI states
  isLoading: boolean;
  isGeneratingSummary: boolean;
  error: string | null;
  showTimestamps: boolean;
  
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
  clearData: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  videoUrl: '',
  transcript: [],
  summary: '',
  selectedLanguage: 'en',
  thumbnail: null,
  isLoading: false,
  isGeneratingSummary: false,
  error: null,
  showTimestamps: true,
  
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
  clearData: () => set({ 
    transcript: [], 
    summary: '', 
    thumbnail: null,
    error: null,
    isLoading: false,
    isGeneratingSummary: false
  }),
}));

export type { TranscriptLine, VideoThumbnail };