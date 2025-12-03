# Baller Up

A full-stack web application to track who's next to play on the basketball court.

## Features

- **Queue Management** - Join the queue, see your position, and get called when it's your turn
- **Score Tracking** - Keep track of scores for two teams: Good Guys vs Bad Guys
- **Persistent Storage** - Queue and scores are saved between sessions using SQLite
- **Mobile-Friendly** - Responsive design optimized for use on phones at the court
- **Real-Time Updates** - See queue changes instantly

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | Get current queue list |
| POST | `/api/join` | Join queue with `{ name: string }` |
| POST | `/api/leave` | Leave queue with `{ name: string }` |
| POST | `/api/next` | Call next player, removes from queue |
| GET | `/api/scores` | Get current scores |
| POST | `/api/scores` | Update scores with `{ good?: number, bad?: number }` |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Running the Application

```bash
npm run dev
```

The application will start on port 5000.

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

## Usage

1. **Join the Queue** - Enter your name and click "Join" to get in line
2. **Track Your Position** - See where you are in the queue (position #1 is next up!)
3. **Keep Score** - Use the +/- buttons to track points for each team
4. **Call Next Player** - Click "Next Up" to remove the first player and call the next one
5. **Leave Queue** - Click the trash icon next to any name to remove them from the queue

## Notes

- The queue and scores persist in a SQLite database (`data.db`)
- Delete `data.db` to reset all data
- The app works great on mobile devices for courtside use

## Authors

- **Daniel Ribeirinha-Braga** - [DBragz](https://github.com/DBragz)
- **Replit Agent** - AI-assisted development and Replit deployment

## License

ISC

## Acknowledgments

- Original concept by [DBragz](https://github.com/DBragz/Baller-Up)
- Built with [Replit](https://replit.com)
