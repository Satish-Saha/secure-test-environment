"use client";

import { Box, Button, Container, Typography, Paper } from "@mui/material";

export default function BlockedPage() {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Unsupported Browser
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This assessment can only be taken in Google Chrome.
          </Typography>
          <Typography variant="body2" sx={{ mb: 4 }}>
            Please reopen this link in Chrome to continue.
          </Typography>
          <Button variant="contained" color="primary" onClick={handleReload}>
            Reload in Chrome
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
