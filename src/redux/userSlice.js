import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  _id: "",
  username: "",
  email: "",
  profilePicture: null, // Updated to reflect the new field
  token: "",
  role: "student", // Default role
  otp: "",
  otpExpiry: null,
  googleId: null,
  linkedInId: null,
  githubId: null,
  onlineUser: [],
  socketConnection: null
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state._id = action.payload._id;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.profilePicture = action.payload.profilePicture;
      state.role = action.payload.role;
      state.googleId = action.payload.googleId;
      state.linkedInId = action.payload.linkedInId;
      state.githubId = action.payload.githubId;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    logout: (state) => {
      Object.assign(state, initialState);
    },
    setOnlineUser: (state, action) => {
      state.onlineUser = action.payload;
    },
    setSocketConnection: (state, action) => {
      state.socketConnection = action.payload;
    },
    setOtp: (state, action) => {
      state.otp = action.payload.otp;
      state.otpExpiry = action.payload.otpExpiry;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUser, setToken, logout, setOnlineUser, setSocketConnection, setOtp } = userSlice.actions;

export default userSlice.reducer;
