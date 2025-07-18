import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";

type SnackbarType = {
  showMessage: (message: string, severity?: "success" | "error" | "info") => void;
};

const SnackbarContext = createContext<SnackbarType>({
  showMessage: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info">("info");

  const showMessage = (msg: string, sev: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={severity} onClose={() => setOpen(false)} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
