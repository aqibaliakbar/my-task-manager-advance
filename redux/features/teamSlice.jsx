import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentTeam: null,
};

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
      if (action.payload) {
        localStorage.setItem("currentTeam", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("currentTeam");
      }
    },
  },
});

export const { setCurrentTeam } = teamSlice.actions;
export default teamSlice.reducer;
