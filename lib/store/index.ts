import { configureStore } from "@reduxjs/toolkit";
import auditReducer from "./auditSlice";
import mcpReducer from "./mcpSlice";
import postReducer from "./postSlice";
import taskReducer from "./taskSlice";

export const store = configureStore({
  reducer: {
    audit: auditReducer,
    mcp: mcpReducer,
    post: postReducer,
    task: taskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
