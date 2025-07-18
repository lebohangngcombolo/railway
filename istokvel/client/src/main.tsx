import { GoogleOAuthProvider } from '@react-oauth/google'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import { SnackbarProvider } from './context/SnackbarContext'; // NEW

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
        <SnackbarProvider> {/* Wrap with Snackbar context */}
          <App />
        </SnackbarProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);



