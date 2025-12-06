import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon } from "lucide-react";
import type { Scores } from "@shared/schema";
import "./home.css";

export default function Home() {
  const [name, setName] = useState("");
  const [lastCalled, setLastCalled] = useState<string | null>(null);
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

  const { data: queueData, isLoading: queueLoading } = useQuery<{ queue: string[] }>({
    queryKey: ["/api/queue"],
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery<Scores>({
    queryKey: ["/api/scores"],
  });

  const queue = queueData?.queue || [];
  const scores = scoresData || { good: 0, bad: 0, targetScore: 21 };
  const gameStarted = scores.good > 0 || scores.bad > 0;

  const joinMutation = useMutation({
    mutationFn: async (playerName: string) => {
      return await apiRequest("POST", "/api/join", { name: playerName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
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
      return await apiRequest("POST", "/api/leave", { name: playerName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
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
      const response = await apiRequest("POST", "/api/next", {});
      return await response.json() as { next: string | null; queue: string[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
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
      return await apiRequest("POST", "/api/scores", update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
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
      return await apiRequest("POST", "/api/scores/reset", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
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
      return await apiRequest("POST", "/api/scores/target", { targetScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
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

  const isLoading = joinMutation.isPending || leaveMutation.isPending || nextMutation.isPending;

  return (
    <div className="app-container">
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

      <div className="target-score-container">
        <label className="target-score-label" htmlFor="target-score">
          Play to:
        </label>
        <input
          id="target-score"
          type="number"
          className={`target-score-input ${gameStarted ? 'locked' : ''}`}
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
        {gameStarted && (
          <span className="target-score-locked" data-testid="text-target-locked">
            (locked)
          </span>
        )}
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

      <div className="reset-container">
        <button
          className="reset-button"
          onClick={() => resetScoresMutation.mutate()}
          disabled={isLoading || (scores.good === 0 && scores.bad === 0)}
          data-testid="button-reset-scores"
        >
          Reset Scores
        </button>
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
