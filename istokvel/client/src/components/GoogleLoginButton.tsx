import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const handleLogin = async (credentialResponse: any) => {
    console.log("Google credential:", credentialResponse?.credential); // Debug log

    try {
      const res = await axios.post("http://localhost:5001/api/auth/google", {
        token: credentialResponse.credential,
      });

      console.log("Backend response:", res.data); // Debug log

      if (res.data.access_token) {
  localStorage.setItem("token", res.data.access_token);

  const user = {
    ...res.data.user,
    is_verified: true, // ✅ required by getCurrentUser()
  };

  localStorage.setItem("user", JSON.stringify(user));

  showMessage("Login successful!", "success");
  navigate("/dashboard");
}


    } catch (err: any) {
      console.error("Login failed:", err.response?.data || err.message);
      showMessage(err.response?.data?.error || "Google login failed", "error");
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleLogin}
      onError={() => showMessage("Google login error", "error")}
      useOneTap
    />
  );
};

export default GoogleLoginButton;
