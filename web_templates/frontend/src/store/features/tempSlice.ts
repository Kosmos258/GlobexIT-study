import { createSlice } from "@reduxjs/toolkit";

// Состояния для хранения поискового запроса
// к результатам tempApi
export const initialState = {
    query: "",

}

const tempSearchSlice = createSlice({
    name: "tempSearch",
    initialState,
    reducers: {
        setQuery: (state, { payload }) => {
            state.query = payload
        },
        reset: () => initialState
    }
})

export const tempSearchReducer = tempSearchSlice.reducer;
export const tempSearchActions = tempSearchSlice.actions;