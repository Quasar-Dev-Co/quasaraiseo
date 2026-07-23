import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PostFormState {
  targetKeyword: string;
  secondaryKeywords: string;
  contentType: string;
  tone: string;
  wordCount: number;
  language: string;
  audience: string;
  callToAction: string;
  internalLinks: string;
  outline: string;
}

export interface PostContent {
  title: string;
  metaDescription: string;
  slug: string;
  headings: string[];
  body: string;
  wordCount: number;
  readingTime: number;
}

export interface PostState {
  form: PostFormState;
  isGenerating: boolean;
  generationProgress: number;
  generationStep: string;
  generatedContent: PostContent | null;
  contentHistory: Array<{
    id: string;
    keyword: string;
    title: string;
    createdAt: string;
    status: "draft" | "published";
  }>;
  mobileSidebarOpen: boolean;
}

const initialState: PostState = {
  form: {
    targetKeyword: "",
    secondaryKeywords: "",
    contentType: "Blog Post",
    tone: "Professional",
    wordCount: 1500,
    language: "English",
    audience: "",
    callToAction: "",
    internalLinks: "",
    outline: "",
  },
  isGenerating: false,
  generationProgress: 0,
  generationStep: "",
  generatedContent: null,
  contentHistory: [
    { id: "post-1", keyword: "ai seo audit tool", title: "How AI is Transforming SEO Audits in 2026", createdAt: "2026-07-22", status: "published" },
    { id: "post-2", keyword: "technical seo guide", title: "The Complete Technical SEO Guide for SaaS Companies", createdAt: "2026-07-20", status: "draft" },
    { id: "post-3", keyword: "keyword research strategy", title: "10 Keyword Research Strategies That Actually Work", createdAt: "2026-07-18", status: "published" },
  ],
  mobileSidebarOpen: false,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    updateForm(state, action: PayloadAction<Partial<PostFormState>>) {
      state.form = { ...state.form, ...action.payload };
    },
    setGenerating(state, action: PayloadAction<boolean>) {
      state.isGenerating = action.payload;
      if (action.payload) {
        state.generationProgress = 0;
        state.generationStep = "Analyzing keyword intent...";
      }
    },
    updateProgress(state, action: PayloadAction<{ progress: number; step: string }>) {
      state.generationProgress = action.payload.progress;
      state.generationStep = action.payload.step;
    },
    setGeneratedContent(state, action: PayloadAction<PostContent>) {
      state.generatedContent = action.payload;
      state.isGenerating = false;
      state.generationProgress = 100;
      state.generationStep = "Content ready!";
    },
    clearContent(state) {
      state.generatedContent = null;
      state.generationProgress = 0;
      state.generationStep = "";
    },
    addToHistory(state, action: PayloadAction<{ keyword: string; title: string }>) {
      state.contentHistory.unshift({
        id: `post-${Date.now()}`,
        keyword: action.payload.keyword,
        title: action.payload.title,
        createdAt: new Date().toISOString().split("T")[0],
        status: "draft",
      });
    },
    resetForm(state) {
      state.form = initialState.form;
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
  },
});

export const {
  updateForm,
  setGenerating,
  updateProgress,
  setGeneratedContent,
  clearContent,
  addToHistory,
  resetForm,
  setMobileSidebarOpen,
} = postSlice.actions;

export default postSlice.reducer;
