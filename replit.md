# Baller Up

Basketball court queue management application to track who's next to play.

## Overview

A full-stack app that allows players to:
- Join a queue to wait for their turn on the court
- See their position in line
- Track game scores for two teams (Good Guys vs Bad Guys)
- Call the next player when a spot opens

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3) for persistent storage

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/
│   │   │   └── home.tsx    # Main queue page
│   │   ├── components/ui/  # shadcn components
│   │   └── App.tsx         # App router
│   └── index.html
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # SQLite database layer
│   └── index.ts            # Server entry point
├── shared/
│   └── schema.ts           # Shared TypeScript types and Zod schemas
└── data.db                 # SQLite database file (auto-created)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | Get current queue list |
| POST | `/api/join` | Join queue with `{ name: string }` |
| POST | `/api/leave` | Leave queue with `{ name: string }` |
| POST | `/api/next` | Call next player, removes from queue |
| GET | `/api/scores` | Get current scores (includes targetScore) |
| POST | `/api/scores` | Update scores with `{ good?: number, bad?: number }` |
| POST | `/api/scores/reset` | Reset both scores to 0 (unlocks target score) |
| POST | `/api/scores/target` | Set target score with `{ targetScore: number }` |

## Running the Application

The application runs on port 5000 with the `npm run dev` command which:
- Starts the Express backend server
- Starts the Vite development server for React frontend
- Both are served from the same port

## Database

SQLite database (`data.db`) stores:
- **queue table**: Player names, positions, timestamps
- **scores table**: Good/Bad team scores (singleton row)

Queue persists between sessions. Delete `data.db` to reset.

## Authors

- Original repository: [DBragz/Baller-Up](https://github.com/DBragz/Baller-Up)
- Daniel Ribeirinha-Braga
