import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    user: {
      userId: 0,
      displayName: "",
      accessToken: "",
      refreshToken: "",
    },
  },
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true
      state.user = {
        userId: action.payload.userId,
        displayName: action.payload.displayName,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      }
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = {
        userId: 0,
        displayName: "",
        accessToken: "",
        refreshToken: "",
      }
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
