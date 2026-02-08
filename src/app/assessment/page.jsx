"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { isChromeBrowser, getBrowserDetails } from "../../security/browserCheck";
import { requestFullscreen, addFullscreenChangeListener, removeFullscreenChangeListener, isFullscreen } from "../../security/fullscreenGuard";
import { addFocusListeners, removeFocusListeners } from "../../security/focusTracker";
import { addClipboardBlockers } from "../../security/clipboardTracker";
import { useCountdown } from "../../security/timer";
import { logEvent, startBatchSender, flushAndSubmit } from "../../logger/batchSender";
import { getOrCreateAttemptId } from "../../logger/eventSchema";
import { isSubmitted } from "../../logger/localStorageSync";

const ASSESSMENT_DURATION_SECONDS = 30 * 60; // 30 minutes

export default function AssessmentPage() {
  const router = useRouter();
  const [fullscreenPromptOpen, setFullscreenPromptOpen] = useState(false);
  const [fullscreenWarningOpen, setFullscreenWarningOpen] = useState(false);
  const [focusWarningOpen, setFocusWarningOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const clipboardCleanupRef = useRef(null);
  const fullscreenStateRef = useRef(false);
  const fsHandlerRef = useRef(null);

  const { minutes, seconds } = useCountdown(ASSESSMENT_DURATION_SECONDS, {
    onExpire: async () => {
      logEvent("TIMER_EXPIRED");
      logEvent("AUTO_SUBMITTED");
      await flushAndSubmit();
      setAssessmentSubmitted(true);
      router.replace("/submitted");
    }
  });

  const handleClipboardAttempt = useCallback((type) => {
    if (type === "COPY_ATTEMPT" || type === "CUT_ATTEMPT") {
      logEvent("COPY_ATTEMPT");
    } else if (type === "PASTE_ATTEMPT") {
      logEvent("PASTE_ATTEMPT");
    }
    setSnackbar({ open: true, message: "Copy/Paste is disabled" });
  }, []);

  const handleEnterFullscreen = () => {
    requestFullscreen(document.documentElement);
    // Ensure the prompt closes immediately after the user clicks
    setFullscreenPromptOpen(false);
    setFullscreenWarningOpen(false);
  };

  const handleManualSubmit = async () => {
    if (assessmentSubmitted) return;
    logEvent("ASSESSMENT_SUBMITTED");
    await flushAndSubmit();
    setAssessmentSubmitted(true);
    router.replace("/submitted");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const attemptId = getOrCreateAttemptId();
    const browser = getBrowserDetails();

    logEvent("BROWSER_DETECTED", { browser });

    if (!isChromeBrowser()) {
      logEvent("ACCESS_BLOCKED", { browser });
      router.replace("/blocked");
      return;
    }

    if (isSubmitted()) {
      router.replace("/submitted");
      return;
    }

    logEvent("TIMER_STARTED", { durationSeconds: ASSESSMENT_DURATION_SECONDS });

    startBatchSender();

    // On first load, if not already fullscreen, show the prompt
    const initialFs = isFullscreen();
    fullscreenStateRef.current = initialFs;
    if (!initialFs) {
      setFullscreenPromptOpen(true);
    }

    const onFsChange = () => {
      const fs = isFullscreen();
      if (fs) {
        // Entered fullscreen
        logEvent("FULLSCREEN_ENTER");
        fullscreenStateRef.current = true;
        setFullscreenPromptOpen(false);
        setFullscreenWarningOpen(false);
      } else {
        // Exited fullscreen
        logEvent("FULLSCREEN_EXIT");
        fullscreenStateRef.current = false;
        setFullscreenWarningOpen(true);
      }
    };

    fsHandlerRef.current = onFsChange;
    addFullscreenChangeListener(onFsChange);

    // Aggressive polling as primary method
    const fsPollId = window.setInterval(() => {
      const currentFs = isFullscreen();
      const wasFs = fullscreenStateRef.current;
      
      if (wasFs && !currentFs) {
        // Detected exit from fullscreen (e.g., ESC)
        fullscreenStateRef.current = false;
        setFullscreenWarningOpen(true);
      } else if (!wasFs && currentFs) {
        // Detected entry to fullscreen
        fullscreenStateRef.current = true;
        setFullscreenPromptOpen(false);
        setFullscreenWarningOpen(false);
      }
      fullscreenStateRef.current = currentFs;
    }, 100);

    const handleFocus = () => {
      // User has come back to the window/tab
      logEvent("FOCUS_GAINED");
      // Do not auto-close here; user must acknowledge the dialog
    };
    const handleBlur = () => {
      // User is leaving the window/tab
      logEvent("FOCUS_LOST");
      setFocusWarningOpen(true);
    };

    addFocusListeners(handleFocus, handleBlur);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Went to another tab or minimized: treat as leaving assessment
        logEvent("FOCUS_LOST", { reason: "tab_or_window_hidden" });
        setFocusWarningOpen(true);
        setFullscreenWarningOpen(true);
      } else {
        // Came back to this tab/window
        logEvent("FOCUS_GAINED", { reason: "tab_or_window_visible" });
        // Keep dialogs open until user explicitly acknowledges/returns to fullscreen
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    clipboardCleanupRef.current = addClipboardBlockers(handleClipboardAttempt);

    return () => {
      if (fsHandlerRef.current) {
        removeFullscreenChangeListener(fsHandlerRef.current);
      }
      removeFocusListeners(handleFocus, handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(fsPollId);
      if (clipboardCleanupRef.current) clipboardCleanupRef.current();
    };
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Secure Assessment
          </Typography>
          <Typography variant="body1" sx={{ mr: 3 }}>
            Time left: <strong>{formattedTime}</strong>
          </Typography>
          <Typography variant="body2" color="inherit">
            Status: {assessmentSubmitted ? "Submitted" : "In Progress"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Sample Question
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are in a secure, monitored assessment environment. The window is being
            tracked for fullscreen usage, tab switches, and copy/paste attempts.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Q1. Describe how this secure test environment enforces browser, fullscreen,
            focus, clipboard, and timing restrictions.
          </Typography>
          <TextField
            label="Your Answer"
            placeholder="Type your answer here..."
            fullWidth
            multiline
            minRows={6}
            variant="outlined"
            onCopy={(e) => {
              e.preventDefault();
              handleClipboardAttempt("COPY_ATTEMPT");
            }}
            onCut={(e) => {
              e.preventDefault();
              handleClipboardAttempt("CUT_ATTEMPT");
            }}
            onPaste={(e) => {
              e.preventDefault();
              handleClipboardAttempt("PASTE_ATTEMPT");
            }}
          />

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleManualSubmit}
              disabled={assessmentSubmitted}
            >
              Submit Assessment
            </Button>
          </Box>
        </Paper>
      </Container>

      <Dialog open={fullscreenPromptOpen} onClose={() => {}} disableEscapeKeyDown>
        <DialogTitle>Enter Fullscreen Mode</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            This assessment must be taken in fullscreen mode. Click the button below to
            enter fullscreen and continue.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleEnterFullscreen}>
            Enter Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={fullscreenWarningOpen}
        onClose={() => setFullscreenWarningOpen(false)}
      >
        <DialogTitle>Fullscreen Required</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            You have exited fullscreen. Please return to fullscreen to continue the
            assessment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setFullscreenWarningOpen(false);
              handleEnterFullscreen();
            }}
          >
            Return to Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={focusWarningOpen}
        onClose={() => setFocusWarningOpen(false)}
      >
        <DialogTitle>Stay in the Assessment Window</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Do not leave the assessment window while the test is in progress.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setFocusWarningOpen(false)}>
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
