import { createTheme } from "@mui/material";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#1e3a8a",
      light: "#2546a4",
    },
    secondary: {
      main: "#F8FAFC",
      light: "#EDEDED",
    },
    success: {
      main: "#00A04A",
      light: "#F59E0B",
      blue: "#497EFD",
      grey: "#6B7280",
    },
    error: {
      main: "#F75151",
    },
    mode: "light",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});
