import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuditMetrics {
  indexedPages: number;
  technicalHealth: number;
  untappedKeywords: number;
  coreWebVitals: string;
  pagesDescription: string;
  healthDescription: string;
  keywordsDescription: string;
  vitalsDescription: string;
}

export interface AuditFormState {
  websiteUrl: string;
  businessNiche: string;
  targetCountry: string;
  primaryLanguage: string;
  auditFocus: string;
  options: {
    crawl: boolean;
    keywords: boolean;
    pdf: boolean;
  };
}

export interface AuditState {
  activeTab: string;
  form: AuditFormState;
  isGenerating: boolean;
  generationProgress: number;
  generationStep: string;
  creditsUsed: number;
  creditsMax: number;
  metrics: AuditMetrics;
  mobileMenuOpen: boolean;
  theme: "light" | "dark";
}

const initialState: AuditState = {
  activeTab: "Create Audit",
  form: {
    websiteUrl: "",
    businessNiche: "",
    targetCountry: "United States",
    primaryLanguage: "English",
    auditFocus: "",
    options: {
      crawl: true,
      keywords: false,
      pdf: false,
    },
  },
  isGenerating: false,
  generationProgress: 0,
  generationStep: "",
  creditsUsed: 36,
  creditsMax: 50,
  metrics: {
    indexedPages: 248,
    technicalHealth: 88,
    untappedKeywords: 126,
    coreWebVitals: "Good",
    pagesDescription: "15 orphan-risk URLs",
    healthDescription: "Strong crawl health",
    keywordsDescription: "High-intent opportunities",
    vitalsDescription: "Needs improvement",
  },
  mobileMenuOpen: false,
  theme: "dark",
};

const auditSlice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    updateForm(state, action: PayloadAction<Partial<AuditFormState>>) {
      state.form = { ...state.form, ...action.payload };
    },
    updateOptions(state, action: PayloadAction<Partial<AuditFormState["options"]>>) {
      state.form.options = { ...state.form.options, ...action.payload };
    },
    setGenerating(state, action: PayloadAction<boolean>) {
      state.isGenerating = action.payload;
      if (action.payload) {
        state.generationProgress = 0;
        state.generationStep = "Initializing crawler...";
      }
    },
    updateProgress(state, action: PayloadAction<{ progress: number; step: string }>) {
      state.generationProgress = action.payload.progress;
      state.generationStep = action.payload.step;
    },
    completeAudit(state, action: PayloadAction<AuditMetrics>) {
      state.isGenerating = false;
      state.generationProgress = 100;
      state.generationStep = "Audit report ready!";
      state.metrics = action.payload;
      if (state.creditsUsed < state.creditsMax) {
        state.creditsUsed += 1;
      }
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.mobileMenuOpen = action.payload;
    },
    resetForm(state) {
      state.form = initialState.form;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
  },
});

export const {
  setActiveTab,
  updateForm,
  updateOptions,
  setGenerating,
  updateProgress,
  completeAudit,
  setMobileMenuOpen,
  resetForm,
  toggleTheme,
} = auditSlice.actions;

export default auditSlice.reducer;
