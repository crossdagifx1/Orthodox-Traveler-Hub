import { createContext, useContext, useState, ReactNode } from "react";
import { Mezmur } from "@workspace/api-client-react";

interface PlayerContextType {
  currentTrack: Mezmur | null;
  isPlaying: boolean;
  playTrack: (track: Mezmur) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Mezmur | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Mezmur) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const pauseTrack = () => setIsPlaying(false);
  const resumeTrack = () => setIsPlaying(true);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
