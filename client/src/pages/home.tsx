import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, ChevronDown, Plus, Users, MapPin, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import type { Scores, Location } from "@shared/schema";
import "./home.css";

export default function Home() {
  const [name, setName] = useState("");
  const [customLocationName, setCustomLocationName] = useState("");
  const [lastCalled, setLastCalled] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("locationId");
    }
    return null;
  });
  const [showLocationDialog, setShowLocationDialog] = useState(!locationId);
  const [showLocationSwitcher, setShowLocationSwitcher] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (locationId) {
      localStorage.setItem("locationId", locationId);
    }
  }, [locationId]);

  // Fetch current location
  const { data: currentLocation } = useQuery<Location>({
    queryKey: ["/api/locations", locationId],
    enabled: !!locationId,
  });

  // Fetch all active locations
  const { data: locationsData, refetch: refetchLocations } = useQuery<{ locations: Location[] }>({
    queryKey: ["/api/locations"],
  });

  const locations = locationsData?.locations || [];

  // Check if current location still exists
  useEffect(() => {
    if (locationId && locationsData && !locationsData.locations.find(l => l.id === locationId)) {
      setLocationId(null);
      setShowLocationDialog(true);
      localStorage.removeItem("locationId");
      toast({
        title: "Game ended",
        description: "The game you were in has ended due to inactivity",
      });
    }
  }, [locationId, locationsData, toast]);

  const { data: queueData, isLoading: queueLoading } = useQuery<{ queue: string[] }>({
    queryKey: ["/api/locations", locationId, "queue"],
    enabled: !!locationId,
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery<Scores>({
    queryKey: ["/api/locations", locationId, "scores"],
    enabled: !!locationId,
  });

  const queue = queueData?.queue || [];
  const scores = scoresData || { good: 0, bad: 0, targetScore: 21 };
  const gameStarted = scores.good > 0 || scores.bad > 0;
  const hasShownWinConfetti = useRef(false);

  // Trigger confetti when a team wins
  useEffect(() => {
    const goodWins = scores.good >= scores.targetScore;
    const badWins = scores.bad >= scores.targetScore;
    
    if ((goodWins || badWins) && !hasShownWinConfetti.current) {
      hasShownWinConfetti.current = true;
      
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = goodWins ? ['#9c27b0', '#ba68c8', '#e1bee7'] : ['#87ceeb', '#b0e0e6', '#add8e6'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      toast({
        title: goodWins ? "Good Guys Win!" : "Bad Guys Win!",
        description: `Game over! Final score: ${scores.good} - ${scores.bad}`,
      });
    }

    if (scores.good === 0 && scores.bad === 0) {
      hasShownWinConfetti.current = false;
    }
  }, [scores.good, scores.bad, scores.targetScore, toast]);

  const createLocationMutation = useMutation({
    mutationFn: async (customName: string | undefined) => {
      const response = await apiRequest("POST", "/api/locations", customName ? { name: customName } : {});
      return await response.json() as Location;
    },
    onSuccess: (location) => {
      setLocationId(location.id);
      setShowLocationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Game created!",
        description: `Welcome to ${location.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (playerName: string) => {
      return await apiRequest("POST", `/api/locations/${locationId}/join`, { name: playerName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "queue"] });
      setName("");
      toast({
        title: "You're in!",
        description: "You've joined the queue. Get ready to ball!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't join",
        description: error.message || "Failed to join queue",
        variant: "destructive",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (playerName: string) => {
      return await apiRequest("POST", `/api/locations/${locationId}/leave`, { name: playerName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "queue"] });
      toast({
        title: "Left queue",
        description: "You've been removed from the queue",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave queue",
        variant: "destructive",
      });
    },
  });

  const nextMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/locations/${locationId}/next`, {});
      return await response.json() as { next: string | null; queue: string[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "queue"] });
      if (data?.next) {
        setLastCalled(data.next);
        toast({
          title: "Next up!",
          description: `${data.next} - you're on!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to call next player",
        variant: "destructive",
      });
    },
  });

  const scoreMutation = useMutation({
    mutationFn: async (update: { good?: number; bad?: number }) => {
      return await apiRequest("POST", `/api/locations/${locationId}/scores`, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "scores"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update score",
        variant: "destructive",
      });
    },
  });

  const resetScoresMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/locations/${locationId}/scores/reset`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "scores"] });
      toast({
        title: "Scores reset",
        description: "Both scores have been reset to 0",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset scores",
        variant: "destructive",
      });
    },
  });

  const targetScoreMutation = useMutation({
    mutationFn: async (targetScore: number) => {
      return await apiRequest("POST", `/api/locations/${locationId}/scores/target`, { targetScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "scores"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update target score",
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    const trimmed = name.trim();
    if (trimmed) {
      joinMutation.mutate(trimmed);
    }
  };

  const handleJoinLocation = (id: string) => {
    setLocationId(id);
    setShowLocationDialog(false);
    setShowLocationSwitcher(false);
    const loc = locations.find(l => l.id === id);
    if (loc) {
      toast({
        title: "Joined game!",
        description: `Welcome to ${loc.name}`,
      });
    }
  };

  const handleSwitchLocation = () => {
    refetchLocations();
    setShowLocationSwitcher(!showLocationSwitcher);
  };

  const isLoading = joinMutation.isPending || leaveMutation.isPending || nextMutation.isPending;

  // Location selection dialog
  if (showLocationDialog) {
    return (
      <div className="app-container location-dialog-view">
        {/* Theme Toggle Button - Fixed at top right */}
        <div className="theme-toggle-container">
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="location-dialog">
          <div className="header">
            <img src="/baller-up.svg" alt="Baller Up logo" className="logo-img" />
            <h1 className="title">Baller Up</h1>
          </div>

          <div className="location-options">
            <div className="create-game-form">
              <input
                type="text"
                className="location-name-input"
                placeholder="Location name (e.g., Main Gym, Court 3)"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                data-testid="input-location-name"
              />
              <button
                className="create-game-button"
                onClick={() => {
                  createLocationMutation.mutate(customLocationName.trim() || undefined);
                  setCustomLocationName("");
                }}
                disabled={createLocationMutation.isPending}
                data-testid="button-create-game"
              >
                <Plus size={24} />
                <span>Create New Game</span>
              </button>
            </div>

            {locations.length > 0 && (
              <>
                <div className="divider">
                  <span>or join an existing game</span>
                </div>

                <div className="existing-games">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      className="game-option"
                      onClick={() => handleJoinLocation(loc.id)}
                      data-testid={`button-join-game-${loc.id}`}
                    >
                      <Users size={20} />
                      <span className="game-name">{loc.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Theme Toggle Button - Fixed at top right */}
      <div className="theme-toggle-container">
        <button
          className="theme-toggle"
          onClick={() => setIsDark(!isDark)}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="header">
        <img src="/baller-up.svg" alt="Baller Up logo" className="logo-img" />
        <h1 className="title">Baller Up</h1>
      </div>

      {/* Clickable Location Name with Dropdown */}
      <div className="location-alias-wrapper">
        <button
          className="location-alias"
          onClick={handleSwitchLocation}
          data-testid="button-location-alias"
        >
          <MapPin size={16} />
          <span data-testid="text-location-alias">{currentLocation?.name || "Loading..."}</span>
          <ChevronDown size={16} className="location-chevron" />
        </button>

        {showLocationSwitcher && (
          <div className="location-dropdown" data-testid="dropdown-locations">
            <button
              className="dropdown-option create"
              onClick={() => {
                setShowLocationSwitcher(false);
                setShowLocationDialog(true);
              }}
              data-testid="button-new-game-dropdown"
            >
              <Plus size={16} />
              <span>New Game</span>
            </button>
            {locations.filter(l => l.id !== locationId).map((loc) => (
              <button
                key={loc.id}
                className="dropdown-option"
                onClick={() => handleJoinLocation(loc.id)}
                data-testid={`button-switch-to-${loc.id}`}
              >
                <Users size={16} />
                <span>{loc.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="game-controls-row">
        <div className="target-score-section">
          <label className="target-score-label" htmlFor="target-score">
            Play to:
          </label>
          <div className={`target-score-wrapper ${gameStarted ? 'locked' : ''}`}>
            <button
              className="target-score-button"
              onClick={() => {
                if (scores.targetScore > 1) {
                  targetScoreMutation.mutate(scores.targetScore - 1);
                }
              }}
              disabled={gameStarted || isLoading || scores.targetScore <= 1}
              data-testid="button-target-minus"
            >
              -
            </button>
            <input
              id="target-score"
              type="number"
              className="target-score-input"
              value={scores.targetScore}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  targetScoreMutation.mutate(val);
                }
              }}
              min={1}
              max={100}
              disabled={gameStarted || isLoading}
              data-testid="input-target-score"
            />
            <button
              className="target-score-button"
              onClick={() => {
                if (scores.targetScore < 100) {
                  targetScoreMutation.mutate(scores.targetScore + 1);
                }
              }}
              disabled={gameStarted || isLoading || scores.targetScore >= 100}
              data-testid="button-target-plus"
            >
              +
            </button>
            {gameStarted && <Lock size={14} className="lock-icon" />}
          </div>
        </div>
        <button
          className="reset-button"
          onClick={() => resetScoresMutation.mutate()}
          disabled={isLoading || (scores.good === 0 && scores.bad === 0)}
          data-testid="button-reset-scores"
        >
          Reset Scores
        </button>
      </div>

      <div className="scores-container">
        <div className="score-card good">
          <h2 className="score-title" data-testid="text-good-guys-title">Good Guys</h2>
          <div className="score-display">
            <button
              className="score-button"
              onClick={() => scoreMutation.mutate({ good: Math.max(0, scores.good - 1) })}
              disabled={isLoading || scores.good === 0}
              data-testid="button-good-minus"
            >
              -
            </button>
            <span className="score-value" data-testid="text-good-score">
              {scoresLoading ? "-" : scores.good}
            </span>
            <button
              className="score-button"
              onClick={() => scoreMutation.mutate({ good: scores.good + 1 })}
              disabled={isLoading}
              data-testid="button-good-plus"
            >
              +
            </button>
          </div>
        </div>

        <div className="score-card bad">
          <h2 className="score-title" data-testid="text-bad-guys-title">Bad Guys</h2>
          <div className="score-display">
            <button
              className="score-button"
              onClick={() => scoreMutation.mutate({ bad: Math.max(0, scores.bad - 1) })}
              disabled={isLoading || scores.bad === 0}
              data-testid="button-bad-minus"
            >
              -
            </button>
            <span className="score-value" data-testid="text-bad-score">
              {scoresLoading ? "-" : scores.bad}
            </span>
            <button
              className="score-button"
              onClick={() => scoreMutation.mutate({ bad: scores.bad + 1 })}
              disabled={isLoading}
              data-testid="button-bad-plus"
            >
              +
            </button>
          </div>
        </div>
      </div>


      <div className="name-input-container">
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
          disabled={isLoading}
          data-testid="input-name"
        />
        <button
          className="join-button"
          onClick={handleJoin}
          disabled={isLoading || !name.trim()}
          data-testid="button-join"
        >
          Join
        </button>
      </div>

      <div className="queue-header">
        <h2 className="queue-title" data-testid="text-queue-title">Queue ({queue.length})</h2>
        <button
          className="next-button"
          onClick={() => nextMutation.mutate()}
          disabled={isLoading || queue.length === 0}
          data-testid="button-next"
        >
          Next Up
        </button>
      </div>

      {lastCalled && (
        <div className="success-message" data-testid="alert-last-called">
          Last called: <strong data-testid="text-last-called">{lastCalled}</strong>
        </div>
      )}

      <ol className="queue-list">
        {queue.map((playerName, index) => (
          <li key={playerName} className="queue-item" data-testid={`item-player-${index}`}>
            <span className="queue-item-name" data-testid={`text-player-name-${index}`}>
              {playerName}
            </span>
            <button
              className="remove-button"
              onClick={() => leaveMutation.mutate(playerName)}
              disabled={isLoading}
              data-testid={`button-remove-${index}`}
            >
              Remove
            </button>
          </li>
        ))}
        {!queueLoading && queue.length === 0 && (
          <p className="empty-queue" data-testid="text-empty-queue">No one in line yet.</p>
        )}
      </ol>
    </div>
  );
}
