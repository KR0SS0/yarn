import { useEffect } from "react";

interface ShortcutProps {
  ytPlayerRef: React.RefObject<any>;
  fps: number;
  onCycleVerifier: (direction: "next" | "prev") => void;
}

export const useKeyboardShortcuts = ({
  ytPlayerRef,
  fps,
  onCycleVerifier,
}: ShortcutProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input or textarea
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;

      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const currentTime = player.getCurrentTime();

      switch (e.key.toLowerCase()) {
        case " ": // Spacebar
        case "k":
          e.preventDefault();
          player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
          break;

        case "arrowleft":
          e.preventDefault();
          player.seekTo(currentTime - 5, true);
          break;

        case "arrowright":
          e.preventDefault();
          player.seekTo(currentTime + 5, true);
          break;

        case "j": // Back 10s
          e.preventDefault();
          player.seekTo(currentTime - 10, true);
          break;

        case "l": // Forward 10s
          e.preventDefault();
          player.seekTo(currentTime + 10, true);
          break;

        case ",": // Frame Back
          player.pauseVideo();
          player.seekTo(currentTime - 1 / fps, true);
          break;

        case ".": // Frame Forward
          player.pauseVideo();
          player.seekTo(currentTime + 1 / fps, true);
          break;

        case "m": // Mute toggle
          player.isMuted() ? player.unMute() : player.mute();
          break;

        case "f": // Fullscreen
          const iframe = player.getIframe();
          if (iframe) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              iframe.requestFullscreen?.() ||
                (iframe as any).mozRequestFullScreen?.() ||
                (iframe as any).webkitRequestFullscreen?.() ||
                (iframe as any).msRequestFullscreen?.();
            }
          }
          break;

        case "z":
          e.preventDefault();
          onCycleVerifier("prev");
          break;

        case "x":
          e.preventDefault();
          onCycleVerifier("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fps, onCycleVerifier, ytPlayerRef]);
};