import { useState, useEffect, useRef, useCallback } from "react";

interface UseYouTubePlayerProps {
  videoId: string | null;
}

export const useYouTubePlayer = ({ videoId }: UseYouTubePlayerProps) => {
  const ytPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoData, setVideoData] = useState<{
    title: string;
    author: string;
  } | null>(null);

  // Fetch metadata via oEmbed whenever videoId changes
  useEffect(() => {
    if (!videoId) {
      setVideoData(null);
      return;
    }

    const fetchOEmbed = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (response.ok) {
          const data = await response.json();
          setVideoData({
            title: data.title || "Unknown Title",
            author: data.author_name || "Unknown Channel",
          });
        }
      } catch (err) {
        console.error("oEmbed fetch failed:", err);
      }
    };

    fetchOEmbed();
  }, [videoId]);

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

  const initializePlayer = useCallback(
    (element: HTMLDivElement) => {
      const checkAPIAndBuild = () => {
        if (!(window as any).YT?.Player) {
          setTimeout(checkAPIAndBuild, 100);
          return;
        }

        if (ytPlayerRef.current?.destroy) ytPlayerRef.current.destroy();

        new (window as any).YT.Player(element, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
            autoplay: 1,
            mute: 1,
          },
          events: {
            onReady: (e: any) => {
              ytPlayerRef.current = e.target;
              e.target.playVideo();
              setTimeout(() => {
                e.target.pauseVideo();
                e.target.unMute();
              }, 100);

              // 2. Fallback: If oEmbed didn't work, try the Player API as a last resort
              const internalData = e.target.getVideoData();
              if (internalData?.author && internalData.author !== "unknown") {
                setVideoData(
                  (prev) =>
                    prev || {
                      title: internalData.title,
                      author: internalData.author,
                    },
                );
              }
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
    videoData,
  };
};
