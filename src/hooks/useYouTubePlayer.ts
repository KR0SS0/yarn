import { useState, useEffect, useRef, useCallback } from "react";

interface UseYouTubePlayerProps {
  videoId: string | null;
}

export const useYouTubePlayer = ({ videoId }: UseYouTubePlayerProps) => {
  const ytPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load API Script
  useEffect(() => {
    if (
      document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    )
      return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // YouTube Player Initialization Logic
  // Using useCallback so it can be used inside the Callback Ref
  const initializePlayer = useCallback(
    (element: HTMLDivElement) => {
      const checkAPIAndBuild = () => {
        if (!(window as any).YT?.Player) {
          setTimeout(checkAPIAndBuild, 100);
          return;
        }

        // Cleanup existing player to prevent memory leaks or double-renders
        if (ytPlayerRef.current?.destroy) ytPlayerRef.current.destroy();

        new (window as any).YT.Player(element, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: { controls: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e: any) => {
              ytPlayerRef.current = e.target;
            },
            onStateChange: (e: any) => {
              const s = (window as any).YT.PlayerState;
              setIsPlaying(e.data === s.PLAYING || e.data === s.BUFFERING);
            },
          },
        });
      };
      checkAPIAndBuild();
    },
    [videoId],
  );

  // Callback Ref: This fires the moment the VideoPlayer's container div enters the DOM
  const playerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && videoId) initializePlayer(node);
    },
    [videoId, initializePlayer],
  );

  return {
    ytPlayerRef,
    isPlaying,
    playerRefCallback,
  };
};
