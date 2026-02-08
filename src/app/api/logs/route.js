import { NextResponse } from "next/server";

// In-memory store for demo purposes
// Map<attemptId, { eventIds: Set<string>, events: any[], submitted: boolean }>
const attempts = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const { attemptId, events, markSubmitted } = body || {};

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    const evs = Array.isArray(events) ? events : [];

    let record = attempts.get(attemptId);
    if (!record) {
      record = {
        eventIds: new Set(), // Track received eventIds for deduplication
        events: [],
        submitted: false
      };
      attempts.set(attemptId, record);
    }

    if (record.submitted) {
      return NextResponse.json(
        { error: "Attempt already submitted; further logs are immutable" },
        { status: 409 }
      );
    }

    // Backend deduplication: filter out duplicate eventIds
    let newEvents = [];
    let duplicatesIgnored = 0;

    for (const event of evs) {
      const eventId = event.eventId;

      // If we've already seen this eventId, skip it (duplicate)
      if (eventId && record.eventIds.has(eventId)) {
        duplicatesIgnored++;
        continue;
      }

      // Track the eventId to prevent future duplicates
      if (eventId) {
        record.eventIds.add(eventId);
      }

      newEvents.push(event);
    }

    // Store only the new (non-duplicate) events
    if (newEvents.length > 0) {
      record.events.push(...newEvents);
    }

    if (markSubmitted) {
      record.submitted = true;
    }

    // Return detailed response for debugging
    return NextResponse.json({
      ok: true,
      received: evs.length,
      saved: newEvents.length,
      duplicatesIgnored,
      submitted: record.submitted
    });
  } catch (err) {
    console.error("Log API error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
