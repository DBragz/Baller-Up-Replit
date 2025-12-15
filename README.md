# Baller Up

A full-stack web application for managing basketball court queues and game scores across multiple locations. Perfect for tracking who's next to play at different courts, managing player queues, and keeping score during games.

## Overview

Baller Up is a location-based queue management system designed for basketball courts. Players can create or join game locations, join a queue to wait for their turn, track game scores for two teams (Good Guys vs Bad Guys), and switch between different active games. The application features a modern, mobile-friendly interface with real-time updates, confetti celebrations, and automatic cleanup of inactive games.

## Features

### Core Functionality

- **Multi-Location Support**: Create and manage multiple game locations simultaneously, each with its own queue and scores
- **Queue Management**: Join a queue, see your position, and get called when it's your turn
- **Score Tracking**: Keep track of scores for two teams (Good Guys vs Bad Guys) with customizable target scores (1-100)
- **Location Switching**: Seamlessly switch between different active game locations by clicking the location name (with 📍 icon) in the center of the page
- **Auto-Generated Names**: New locations get randomly generated basketball-themed names (e.g., "Blazing Ballers", "Thunder Court", "Cosmic Hoopers")
- **Custom Location Names**: Optionally provide custom names when creating new games

### User Experience

- **Real-Time Updates**: See queue changes and score updates instantly using React Query
- **Mobile-Friendly**: Responsive design optimized for use on phones at the court
- **Theme Switching**: Light/dark mode toggle with system preference detection and persistent storage
- **Confetti Celebrations**: Animated confetti when a team wins (purple for Good Guys, blue for Bad Guys)
- **Toast Notifications**: User-friendly notifications for all actions (join, leave, score updates, etc.)
- **Clickable Location Name**: Location name displayed in the center with 📍 icon - click to switch between games or create new ones
- **Game State Management**: Target score locked once game starts, preventing mid-game changes (indicated by lock icon)

### Data Management

- **Persistent Storage**: Queue and scores are saved between sessions using SQLite
- **Auto-Cleanup**: Inactive locations (no activity for 30 minutes) are automatically deleted every 5 minutes
- **Activity Tracking**: Each location tracks last activity timestamp for cleanup purposes
- **Data Validation**: All inputs validated using Zod schemas for type safety

## Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library (Radix UI primitives)
- **TanStack Query 5.60** - Server state management and data fetching
- **Wouter 3.3** - Lightweight routing
- **Canvas Confetti** - Celebration animations
- **Framer Motion 11.13** - Animations
- **Lucide React** - Icon library

### Backend
- **Express.js 4.21** - Web server framework
- **TypeScript 5.6** - Type safety
- **better-sqlite3 12.5** - SQLite database driver
- **Zod 3.24** - Schema validation
- **tsx 4.20** - TypeScript execution for development

### Development Tools
- **cross-env 7.0** - Cross-platform environment variables
- **Drizzle Kit 0.31** - Database migrations (configured for PostgreSQL, but using SQLite)
- **ESBuild 0.25** - Fast bundler for production builds
- **Replit Plugins**:
  - `@replit/vite-plugin-cartographer` - Replit integration
  - `@replit/vite-plugin-dev-banner` - Development banner
  - `@replit/vite-plugin-runtime-error-modal` - Error overlay

## Project Structure

```
Baller-Up-Replit/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── home.tsx         # Main queue page with location system
│   │   │   ├── home.css         # Custom styles for home page
│   │   │   └── not-found.tsx    # 404 page
│   │   ├── components/ui/       # shadcn/ui components (50+ components)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-mobile.tsx   # Mobile detection hook
│   │   │   └── use-toast.ts     # Toast notification hook
│   │   ├── lib/
│   │   │   ├── queryClient.ts   # TanStack Query configuration
│   │   │   └── utils.ts         # Utility functions
│   │   ├── App.tsx              # App router and main component
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Global styles
│   └── index.html               # HTML template
├── server/                      # Backend Express server
│   ├── index.ts                 # Server entry point and middleware setup
│   ├── routes.ts                # API endpoint definitions
│   ├── storage.ts               # SQLite database layer with location support
│   ├── vite.ts                  # Vite dev server integration
│   └── static.ts                # Static file serving for production
├── shared/
│   └── schema.ts                # Shared TypeScript types and Zod schemas
├── script/
│   └── build.ts                 # Production build script
├── dist/                         # Production build output (generated)
│   ├── index.cjs                # Bundled server code
│   └── public/                  # Static frontend assets
├── data.db                       # SQLite database file (auto-created)
├── vite.config.ts               # Vite configuration
├── drizzle.config.ts            # Drizzle ORM configuration
├── package.json                 # Dependencies and scripts
└── replit.md                    # Replit-specific documentation
```

## Database Schema

### Locations Table
Stores game locations with their scores and metadata.

```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,                    -- Unique location identifier
  name TEXT NOT NULL,                     -- Location name (basketball-themed or custom)
  good_score INTEGER NOT NULL DEFAULT 0,  -- Good Guys team score
  bad_score INTEGER NOT NULL DEFAULT 0,    -- Bad Guys team score
  target_score INTEGER NOT NULL DEFAULT 21, -- Target score to win (1-100)
  last_activity INTEGER NOT NULL,          -- Timestamp of last activity
  created_at INTEGER NOT NULL             -- Timestamp of creation
)
```

### Queue Table
Stores player queue entries, linked to locations.

```sql
CREATE TABLE queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- Unique queue entry ID
  name TEXT NOT NULL,                     -- Player name
  position INTEGER NOT NULL,              -- Position in queue (1 = next up)
  location_id TEXT NOT NULL,               -- Foreign key to locations table
  created_at INTEGER NOT NULL,            -- Timestamp of entry
  UNIQUE(name, location_id),              -- Prevent duplicate names per location
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
)
```

**Note**: When a location is deleted, all associated queue entries are automatically removed via CASCADE.

## API Endpoints

### Location Management

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/locations` | Create new location | `{ name?: string }` (optional) | `Location` object |
| GET | `/api/locations` | List all active locations | - | `{ locations: Location[] }` |
| GET | `/api/locations/:locationId` | Get specific location | - | `Location` object |
| DELETE | `/api/locations/:locationId` | Delete location and its queue | - | `{ success: true }` |

### Queue Management (Location-Specific)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/locations/:locationId/queue` | Get queue for location | - | `{ queue: string[] }` |
| POST | `/api/locations/:locationId/join` | Join queue | `{ name: string }` | `{ queue: string[] }` or `{ error: string }` |
| POST | `/api/locations/:locationId/leave` | Leave queue | `{ name: string }` | `{ queue: string[] }` or `{ error: string }` |
| POST | `/api/locations/:locationId/next` | Call next player | - | `{ next: string \| null, queue: string[] }` |

### Score Management (Location-Specific)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/locations/:locationId/scores` | Get current scores | - | `Scores` object |
| POST | `/api/locations/:locationId/scores` | Update scores | `{ good?: number, bad?: number }` | `Scores` object |
| POST | `/api/locations/:locationId/scores/reset` | Reset scores to 0 | - | `Scores` object |
| POST | `/api/locations/:locationId/scores/target` | Set target score | `{ targetScore: number }` (1-100) | `Scores` object |

### Error Responses

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., already in queue)
- `500` - Internal Server Error

## Development Setup

### Prerequisites

- **Node.js 18+** (20.16+ recommended)
- **npm** (comes with Node.js)

### Installation

1. Clone or navigate to the project directory:
```bash
cd Baller-Up-Replit
```

2. Install dependencies:
```bash
npm install
```

### Running in Development Mode

Start the development server:

```bash
npm run dev
```

This command:
- Sets `NODE_ENV=development` using `cross-env` (cross-platform compatible)
- Runs the Express server with `tsx` for TypeScript execution
- Starts Vite dev server in middleware mode
- Enables Hot Module Replacement (HMR) for instant updates
- Serves both API and frontend on the same port (5000 by default)

**Development Features:**
- **Hot Module Replacement**: Changes to React components update instantly without page refresh
- **TypeScript**: Full type checking and IntelliSense support
- **Vite Dev Server**: Fast builds and optimized development experience
- **Replit Plugins**:
  - Cartographer integration for Replit deployment
  - Dev banner showing development mode
  - Runtime error modal for better error visibility
- **API Logging**: All API requests are logged with method, path, status code, duration, and response

**Access the Application:**
- Open `http://localhost:5000` in your browser
- The app will automatically reload when you make changes

**Environment Variables:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Set to `development` automatically by the dev script
- `DB_FILE` - Custom database file path (default: `./data.db`)

### Development Workflow

1. **Frontend Changes**: Edit files in `client/src/` - changes appear instantly
2. **Backend Changes**: Edit files in `server/` - server restarts automatically with `tsx`
3. **Database Changes**: The SQLite database (`data.db`) is created automatically on first run
4. **Type Checking**: Run `npm run check` to verify TypeScript compilation

## Production Setup

### Building for Production

Build the application:

```bash
npm run build
```

This command:
1. **Builds the Frontend**:
   - Runs Vite production build
   - Optimizes and minifies React code
   - Outputs to `dist/public/`
   - Includes all static assets (CSS, JS, images)

2. **Builds the Backend**:
   - Bundles server code with ESBuild
   - Minifies for smaller file size
   - Externalizes most dependencies (keeps them in `node_modules`)
   - Bundles only specified dependencies (see `script/build.ts` allowlist)
   - Outputs to `dist/index.cjs` (CommonJS format)

**Build Output:**
```
dist/
├── index.cjs          # Bundled server (ready to run)
└── public/            # Static frontend assets
    ├── index.html
    ├── assets/
    │   ├── *.js       # Bundled JavaScript
    │   └── *.css      # Bundled CSS
    └── ...
```

### Running in Production

Start the production server:

```bash
npm start
```

Or manually:

```bash
NODE_ENV=production node dist/index.cjs
```

**Production Features:**
- **Static File Serving**: Frontend assets served from `dist/public/`
- **API Routes**: All `/api/*` routes handled by Express
- **SPA Routing**: All non-API routes serve `index.html` for client-side routing
- **Optimized Performance**: Minified code, optimized bundles
- **No Dev Tools**: Vite dev server and HMR disabled

**Environment Variables:**
- `PORT` - Server port (default: 5000, required on Replit)
- `NODE_ENV` - Must be set to `production`
- `DB_FILE` - Custom database file path (default: `./data.db`)

### Production Deployment on Replit

Replit automatically:
1. Detects the `start` script in `package.json`
2. Runs `npm start` when the Repl is started
3. Exposes the application on port 5000 (or the port specified in `PORT` environment variable)
4. Provides a public URL for the application

**Replit-Specific Configuration:**
- The application listens on `0.0.0.0` to accept connections from Replit's proxy
- Port 5000 is the default unfirewalled port on Replit
- Replit plugins are automatically enabled in development mode when `REPL_ID` is set

## Configuration

### Port Configuration

The server listens on the port specified by the `PORT` environment variable, defaulting to 5000:

```bash
# Development
PORT=3000 npm run dev

# Production
PORT=3000 npm start
```

### Database Configuration

The SQLite database file location can be customized:

```bash
DB_FILE=/path/to/custom.db npm run dev
```

Default location: `./data.db` (project root)

### Vite Configuration

The Vite configuration (`vite.config.ts`) includes:
- **Path Aliases**:
  - `@/` → `client/src/`
  - `@shared/` → `shared/`
  - `@assets/` → `attached_assets/`
- **Replit Plugins**: Automatically enabled in development when `REPL_ID` is set
- **Build Output**: `dist/public/` for production
- **React Plugin**: JSX transformation and Fast Refresh

## Auto-Cleanup System

The application includes an automatic cleanup system to manage inactive locations:

- **Inactivity Threshold**: 30 minutes of no activity
- **Cleanup Interval**: Runs every 5 minutes
- **What Gets Cleaned**: Locations with `last_activity` older than 30 minutes
- **Cascade Deletion**: When a location is deleted, all associated queue entries are automatically removed

This prevents the database from growing indefinitely with abandoned games.

## Design System

### Color Scheme

- **Good Guys**: Purple (#9c27b0) with confetti in purple tones
- **Bad Guys**: Sky Blue (#87ceeb) with confetti in blue tones
- **Join Button**: Blue (#646cff)
- **Next Up Button**: Green (#4caf50)
- **Remove Button**: Red (#f44336)
- **Theme Support**: Full light/dark mode with system preference detection

### Typography

- **Location Names**: Bangers font (Google Fonts) for basketball-themed styling
- **Body Text**: System font stack for optimal performance

## Usage Guide

### Creating a Game

1. When you first open the app, you'll see the location selection dialog
2. Optionally enter a custom location name (e.g., "Main Gym", "Court 3")
3. Click "Create New Game" or leave the field empty for a random basketball-themed name
4. The app will create a new location and automatically join it

### Joining an Existing Game

1. In the location selection dialog, you'll see a list of active games
2. Click on any game to join it
3. You can also switch games by clicking the location name (with 📍 icon) in the center of the page

### Managing the Queue

1. **Join Queue**: Enter your name and click "Join"
2. **See Your Position**: Your position in the queue is shown (position #1 is next up)
3. **Call Next Player**: Click "Next Up" to remove the first player and call the next one
4. **Leave Queue**: Click "Remove" next to any name (including your own) to remove them

### Tracking Scores

1. **Adjust Target Score**: Use the +/- buttons or type directly in the input box (1-100 range)
   - Target score is locked once the game starts (when scores > 0)
   - A lock icon (🔒) appears next to the "+" button when the game is locked
   - The input box and buttons are disabled when locked
2. **Update Scores**: Use +/- buttons for each team
3. **Reset Scores**: Click "Reset Scores" to set both teams to 0
4. **Win Celebration**: When a team reaches the target score, confetti animation plays

### Switching Locations

1. Click the location name (with 📍 icon) displayed in the center of the page, below the "Baller Up" title
2. A dropdown menu will appear showing:
   - "New Game" option to create a new location
   - List of all existing active games
3. Click any game name to switch to it
4. Your current location is saved in localStorage and persists across sessions
5. The location name button has a chevron (▼) indicator showing it's clickable

## Troubleshooting

### Port Already in Use

If port 5000 is already in use:

```bash
PORT=3000 npm run dev
```

### Database Issues

If you encounter database errors:
1. Stop the server
2. Delete `data.db` to reset the database
3. Restart the server (database will be recreated automatically)

### Build Errors

If production build fails:
1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript errors: `npm run check`
3. Verify Node.js version is 18+: `node --version`

### Replit-Specific Issues

- **Port Configuration**: Ensure `PORT` environment variable is set to 5000 (or your configured port)
- **Database Persistence**: The `data.db` file persists in Replit's file system
- **Auto-Start**: Replit runs `npm start` automatically when the Repl starts

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (frontend + backend) |
| `npm start` | Start production server |
| `npm run check` | Type-check TypeScript without building |
| `npm run db:push` | Push database schema changes (Drizzle) |

## License

ISC

## Authors

- **Daniel Ribeirinha-Braga** - [DBragz](https://github.com/DBragz)
- **Replit Agent** - AI-assisted development and Replit deployment

## Acknowledgments

- Original concept by [DBragz](https://github.com/DBragz/Baller-Up)
- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
