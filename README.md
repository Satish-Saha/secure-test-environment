# Secure Test Environment Enforcement (React.js (Next.js framework) + Material UI)

This project implements a **secure, locked-down, time-bound, and auditable assessment environment** for high-stakes online tests.

It enforces browser restrictions, prevents content misuse, monitors candidate behavior, and generates a complete event audit trail for employer review.

---

## 🚀 Project Objective

The goal is to ensure candidates complete assessments in a:

- **Chrome-only**
- **Fullscreen enforced**
- **Distraction-minimized**
- **Time-bound**
- **Fully logged and auditable**

secure environment.

This system is intended for employer-vetted assessments where integrity is critical.

---

## ✅ Key Features

---

### 1. Browser Enforcement (Chrome Only)

- Detects browser name and version on load
- Blocks access if browser is not Google Chrome
- Displays a blocking screen with instructions to reopen in Chrome

**Events Logged:**

- `BROWSER_DETECTED`
- `ACCESS_BLOCKED`

---

### 2. Fullscreen Enforcement

- Candidate is prompted to enter fullscreen mode
- Exiting fullscreen triggers warning dialogs
- Fullscreen changes are tracked

**Events Logged:**

- `FULLSCREEN_ENTER`
- `FULLSCREEN_EXIT`

---

### 3. Tab Switch / Focus Monitoring

- Detects when candidate switches tabs or minimizes the window
- Shows warning popups to discourage leaving the assessment

**Events Logged:**

- `FOCUS_LOST`
- `FOCUS_GAINED`

---

### 4. Copy / Paste Attempt Detection

- Prevents copy, cut, and paste actions
- Displays snackbar warnings when attempted

**Events Logged:**

- `COPY_ATTEMPT`
- `PASTE_ATTEMPT`

---

### 5. Timer-Based Assessment Control

- Countdown timer runs during assessment
- Auto-submits when time expires

**Events Logged:**

- `TIMER_STARTED`
- `TIMER_EXPIRED`
- `AUTO_SUBMITTED`

---

## 📝 Unified Event Logging System

All candidate actions are recorded using a unified event schema:

```json
{
  "eventType": "TAB_SWITCH",
  "timestamp": "2026-02-07T10:05:10Z",
  "attemptId": "ATTEMPT123",
  "questionId": null,
  "metadata": {
    "browser": "Chrome 121",
    "focusState": "lost",
    "fullscreen": true
  }
}
```

This provides employers with a complete timestamped audit trail.

---

## 📦 Log Persistence & Offline Safety

- Logs are persisted locally using `localStorage`
- Logs survive refresh, accidental reload, or offline scenarios
- Unsent logs are restored automatically

---

## 📡 Batched Log Delivery to Backend

Logs are not sent one-by-one.

Instead, they are:

- queued locally
- batched efficiently
- posted to backend API

### API Endpoint

```
POST /api/logs
```

Backend is implemented using **Next.js API Routes**.

---

## 🔒 Immutable Logs After Submission

Once the assessment is submitted:

- Logging stops immediately
- Candidate cannot modify past events
- Backend rejects further updates for submitted attempts

**Event Logged:**

- `ASSESSMENT_SUBMITTED`

---

## 👀 Demo Visibility of Logs

For assignment demonstration purposes, the submission page displays logged events in a table.

⚠️ In a real production assessment system, these logs would be visible only to employers/admins and not to candidates.

---

## 🖥️ Tech Stack

- **React.js (Next.js framework)**
- **Next.js (App Router)**
- **Material UI (MUI)**
- LocalStorage persistence
- Next.js API Routes (backend logging)

---

## 📂 Project Structure

```
src/
 ├── app/
 │    ├── assessment/page.jsx        # Main secure assessment UI
 │    ├── blocked/page.jsx           # Unsupported browser screen
 │    ├── submitted/page.jsx         # Submission confirmation
 │    ├── api/logs/route.js          # Backend logging endpoint
 │
 ├── security/
 │    ├── browserCheck.js            # Chrome-only enforcement
 │    ├── fullscreenGuard.js         # Fullscreen tracking
 │    ├── focusTracker.js            # Tab switch detection
 │    ├── clipboardTracker.js        # Copy/paste prevention
 │    ├── timer.js                   # Countdown timer logic
 │
 ├── logger/
 │    ├── eventSchema.js             # Unified schema + attempt ID
 │    ├── eventQueue.js              # Event queue + batching
 │    ├── batchSender.js             # Efficient log delivery
 │    ├── localStorageSync.js        # Persistence + restore
```

---

## ⚙️ Setup & Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

App will run at:

```
http://localhost:3000
```

---

## ✅ Testing Checklist

Recruiters can verify functionality by trying:

- Open in Firefox → blocked screen appears
- Switch browser tab → focus event logged
- Exit fullscreen → warning modal shown
- Attempt copy/paste → prevented + snackbar
- Refresh page → logs persist
- Submit assessment → logs become immutable

---

## 📌 Notes & Future Enhancements

This project demonstrates how secure employer-vetted assessments can be enforced using browser-based monitoring combined with backend audit logging.

Possible future improvements:

- Employer/admin dashboard for log review
- Database persistence (MongoDB/Postgres)
- Advanced tamper-proof storage
- Webcam proctoring integration

---

## 👤 Author

Developed as part of the **Secure Test Environment Enforcement** assignment.
