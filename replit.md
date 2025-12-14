# Baller Up

Basketball court queue management application to track who's next to play at multiple locations.

## Overview

A full-stack app that allows players to:
- Create or join game locations with randomly generated basketball-themed names
- Join a queue to wait for their turn on the court
- See their position in line
- Track game scores for two teams (Good Guys vs Bad Guys)
- Call the next player when a spot opens
- Switch between different game locations to view other courts

## Features

- **Location-based games**: Each court/location has its own queue and scores
- **Random basketball names**: New locations get cool anime-style names (e.g., "Blazing Ballers", "Thunder Court")
- **Sticky location banner**: Shows current location name at top with dropdown to switch
- **Theme switching**: Light/dark mode toggle with system preference detection
- **Mobile responsive**: Optimized for all screen sizes
- **Confetti celebration**: Purple confetti for Good Guys win, blue for Bad Guys
- **Auto-cleanup**: Inactive locations deleted after 30 minutes

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3) for persistent storage
- **Fonts**: Bangers (Google Fonts) for anime-style location names

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── home.tsx    # Main queue page with location system
│   │   │   └── home.css    # Custom styles
│   │   ├── components/ui/  # shadcn components
│   │   └── App.tsx         # App router
│   └── index.html
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # SQLite database layer with location support
│   └── index.ts            # Server entry point
├── shared/
│   └── schema.ts           # Shared TypeScript types and Zod schemas
└── data.db                 # SQLite database file (auto-created)
```

## Database Schema

**locations table:**
- id (TEXT PRIMARY KEY)
- name (TEXT) - Basketball-themed location name
- good_score, bad_score, target_score (INTEGER)
- last_activity, created_at (INTEGER timestamps)

**queue table:**
- id (INTEGER PRIMARY KEY)
- name (TEXT) - Player name
- position (INTEGER)
- location_id (TEXT) - Foreign key to locations
- created_at (INTEGER)

## API Endpoints

### Location Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locations` | Create new location (optional: `{ name }`) |
| GET | `/api/locations` | List all active locations |
| GET | `/api/locations/:id` | Get specific location |
| DELETE | `/api/locations/:id` | Delete location |

### Queue (per location)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations/:id/queue` | Get queue for location |
| POST | `/api/locations/:id/join` | Join queue: `{ name }` |
| POST | `/api/locations/:id/leave` | Leave queue: `{ name }` |
| POST | `/api/locations/:id/next` | Call next player |

### Scores (per location)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations/:id/scores` | Get scores |
| POST | `/api/locations/:id/scores` | Update: `{ good?, bad? }` |
| POST | `/api/locations/:id/scores/reset` | Reset to 0 |
| POST | `/api/locations/:id/scores/target` | Set target: `{ targetScore }` |

## Running the Application

The application runs on port 5000 with the `npm run dev` command which:
- Starts the Express backend server
- Starts the Vite development server for React frontend
- Both are served from the same port

## Auto-Cleanup

A background job runs every 5 minutes to delete locations that have been inactive for more than 30 minutes. This keeps database size manageable.

## Design Colors

- **Good Guys**: Purple (#9c27b0)
- **Bad Guys**: Sky blue (#87ceeb)
- **Join button**: Blue (#646cff)
- **Next Up**: Green (#4caf50)
- **Remove**: Red (#f44336)

## Authors

- Original repository: [DBragz/Baller-Up](https://github.com/DBragz/Baller-Up)
- Daniel Ribeirinha-Braga
