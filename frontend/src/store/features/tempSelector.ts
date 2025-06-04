import { RootState } from "../store";
export const selectTempSearchModule = (state: RootState) => state.tempSearch

export const selectTempSearchQuery = (state: RootState) => selectTempSearchModule(state).query