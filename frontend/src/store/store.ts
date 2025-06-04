import { configureStore } from "@reduxjs/toolkit";
import { tempApi } from "../api/services/tempApi";
import { tempSearchReducer } from "./features/tempSlice";
// import { restaurantApi } from "./services/restaurantApi";
// import { searchReducer } from "./features/search";

export const store = configureStore({
  reducer: {
    [tempApi.reducerPath]: tempApi.reducer,
    tempSearch: tempSearchReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([tempApi.middleware]),
});

export type RootState = ReturnType<typeof store.getState>;