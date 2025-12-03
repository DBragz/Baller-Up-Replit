import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Minus, 
  UserPlus, 
  ArrowRight, 
  Trash2,
  Trophy,
  Clock,
  Loader2
} from "lucide-react";
import type { Scores } from "@shared/schema";

export default function Home() {
  const [name, setName] = useState("");
  const [lastCalled, setLastCalled] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: queueData, isLoading: queueLoading } = useQuery<{ queue: string[] }>({
    queryKey: ["/api/queue"],
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery<Scores>({
    queryKey: ["/api/scores"],
  });

  const queue = queueData?.queue || [];
  const scores = scoresData || { good: 0, bad: 0 };

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

  const handleJoin = () => {
    const trimmed = name.trim();
    if (trimmed) {
      joinMutation.mutate(trimmed);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  const isLoading = joinMutation.isPending || leaveMutation.isPending || nextMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Baller Up</h1>
          </div>
          <p className="text-muted-foreground">Track who's next on the court</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg font-semibold" data-testid="text-good-guys-title">
                Good Guys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 border-purple-500/50 hover:bg-purple-500/20"
                  onClick={() => scoreMutation.mutate({ good: Math.max(0, scores.good - 1) })}
                  disabled={scoreMutation.isPending || scores.good === 0}
                  data-testid="button-good-minus"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span 
                  className="text-4xl font-bold min-w-[60px] text-center tabular-nums"
                  data-testid="text-good-score"
                >
                  {scoresLoading ? "-" : scores.good}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 border-purple-500/50 hover:bg-purple-500/20"
                  onClick={() => scoreMutation.mutate({ good: scores.good + 1 })}
                  disabled={scoreMutation.isPending}
                  data-testid="button-good-plus"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-sky-400/30 bg-gradient-to-b from-sky-400/10 to-sky-400/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg font-semibold" data-testid="text-bad-guys-title">
                Bad Guys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 border-sky-400/50 hover:bg-sky-400/20"
                  onClick={() => scoreMutation.mutate({ bad: Math.max(0, scores.bad - 1) })}
                  disabled={scoreMutation.isPending || scores.bad === 0}
                  data-testid="button-bad-minus"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span 
                  className="text-4xl font-bold min-w-[60px] text-center tabular-nums"
                  data-testid="text-bad-score"
                >
                  {scoresLoading ? "-" : scores.bad}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 border-sky-400/50 hover:bg-sky-400/20"
                  onClick={() => scoreMutation.mutate({ bad: scores.bad + 1 })}
                  disabled={scoreMutation.isPending}
                  data-testid="button-bad-plus"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your name"
                className="flex-1"
                disabled={isLoading}
                data-testid="input-name"
              />
              <Button
                onClick={handleJoin}
                disabled={isLoading || !name.trim()}
                className="gap-2"
                data-testid="button-join"
              >
                {joinMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Join
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                Queue
                <Badge variant="secondary" className="ml-2" data-testid="badge-queue-count">
                  {queue.length}
                </Badge>
              </h2>
            </div>
            <Button
              onClick={() => nextMutation.mutate()}
              disabled={isLoading || queue.length === 0}
              variant="default"
              className="gap-2"
              data-testid="button-next"
            >
              {nextMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Next Up
            </Button>
          </div>

          {lastCalled && (
            <div 
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
              data-testid="alert-last-called"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last called</p>
                <p className="font-semibold text-green-700 dark:text-green-400" data-testid="text-last-called">
                  {lastCalled}
                </p>
              </div>
            </div>
          )}

          {queueLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">No one in line</h3>
                <p className="text-muted-foreground text-sm">Be the first to ball up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {queue.map((playerName, index) => (
                <Card 
                  key={playerName} 
                  className={`transition-all ${index === 0 ? 'border-primary/50 bg-primary/5' : ''}`}
                  data-testid={`card-player-${index}`}
                >
                  <CardContent className="py-3 px-4 flex items-center gap-4">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${index === 0 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`font-medium truncate ${index === 0 ? 'text-lg' : ''}`}
                        data-testid={`text-player-name-${index}`}
                      >
                        {playerName}
                      </p>
                      {index === 0 && (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Clock className="h-3 w-3" />
                          <span>Next up!</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => leaveMutation.mutate(playerName)}
                      disabled={isLoading}
                      data-testid={`button-remove-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
