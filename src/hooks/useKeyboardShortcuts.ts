import { useEffect } from "react";

interface ShortcutProps {
  ytPlayerRef: React.RefObject<any>;
  fps: number;
  onCycleVerifier: (direction: "next" | "prev") => void;
  onControlAction: (type: "seek" | "frame" | "togglePause", value: number) => void;
}

export const useKeyboardShortcuts = ({
  ytPlayerRef,
  fps,
  onCycleVerifier,
  onControlAction,
}: ShortcutProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input or textarea
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;

      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const key = e.key.toLowerCase();

      switch (key) {
        // --- Playback Controls ---
        case " ":
        case "k":
          e.preventDefault();
          onControlAction("togglePause", 0);
          break;

        case "m":
          player.isMuted() ? player.unMute() : player.mute();
          break;

        // --- Standard Seeking (5s) ---
        case "arrowleft":
          e.preventDefault();
          onControlAction("seek", -5);
          break;

        case "arrowright":
          e.preventDefault();
          onControlAction("seek", 5);
          break;

        // --- Large Seeking (10s) ---
        case "j":
          e.preventDefault();
          onControlAction("seek", -10);
          break;

        case "l":
          e.preventDefault();
          onControlAction("seek", 10);
          break;

        // --- Precision Frame Stepping ---
        case ",":
          e.preventDefault();
          onControlAction("frame", -1);
          break;

        case ".":
          e.preventDefault();
          onControlAction("frame", 1);
          break;

        // --- Verification Cycling ---
        case "z":
          e.preventDefault();
          onCycleVerifier("prev");
          break;

        case "x":
          e.preventDefault();
          onCycleVerifier("next");
          break;

        // --- Fullscreen Utility ---
        case "f":
          e.preventDefault();
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
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fps, onCycleVerifier, onControlAction, ytPlayerRef]);
};