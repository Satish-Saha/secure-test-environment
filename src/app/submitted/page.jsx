"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";

import { loadAllEvents, isSubmitted } from "../../logger/localStorageSync";
import { getOrCreateAttemptId } from "../../logger/eventSchema";

export default function SubmittedPage() {
  const [events, setEvents] = useState([]);
  const [attemptId, setAttemptId] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSubmitted()) {
      router.replace("/assessment");
      return;
    }
    const evs = loadAllEvents();
    setEvents(evs || []);
    // Load attempt ID only on client to avoid hydration mismatch
    const id = getOrCreateAttemptId();
    setAttemptId(id);
  }, [router]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Assessment Submitted
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Your responses have been submitted successfully. You may now close this window.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Attempt ID: <strong>{attemptId}</strong>
          </Typography>
          <Button variant="contained" onClick={() => router.replace("/assessment")}
          >
            Start New Attempt (demo only)
          </Button>
        </Paper>

        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            ⚠️ This event log is displayed only for assignment demonstration purposes.
            In a real assessment system, logs would be visible only to employers/admins.
          </Typography>
          <Typography variant="h6" gutterBottom>
            Logged Events (Client-side view)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Browser</TableCell>
                <TableCell>Metadata</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((ev, idx) => {
                const browserMeta = ev?.metadata?.browser;
                const browserText =
                  browserMeta && typeof browserMeta === "object"
                    ? JSON.stringify(browserMeta)
                    : browserMeta || "";

                return (
                  <TableRow key={idx}>
                    <TableCell>{ev.timestamp}</TableCell>
                    <TableCell>{ev.eventType}</TableCell>
                    <TableCell>{browserText}</TableCell>
                    <TableCell>
                      <Typography variant="caption" component="div">
                        {JSON.stringify(ev.metadata)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2">No events found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </Box>
  );
}
