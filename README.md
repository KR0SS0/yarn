# Yarn
A tool that lets runners time their own loading screens using YouTube frame data, while giving verifiers an easy way to audit them without downloading videos.

Yarn is a web-based tool designed to solve the "Time Without Loads" problem in competitive gaming. It bridges the gap between Runners and Verifiers by turning timing into a transparent, shareable, and auditable data format.

## Purpose of tool
In speedrunning, a record time should be determined by a player's skill, not the speed of their hardware. Because one player might have a faster computer/console than another player, many communities use LRT (Load Removed Time). This "pauses the clock" during loading screens to ensure a fair, skill-based competition.

Until now, speedrun moderators have been stuck in a redundant workflow:
1. A Runner times their run's load to see if their Load Removed Time.
2. A Verifier receives the video and re-times the entire thing from scratch to prove the runner wasn't lying.

This manual "double-work" creates massive backlogs and human error. Yarn fixes this. It allows runners to export their timing markers as a JSON. Verifiers simply import the file and "audit" the markers, saving up to an hour of manual work.

### Transparency
Beyond saving time, Yarn introduces a new standard of transparency to the community:

1. Public Verification: Anyone in the community can import that file to see the exact frames used for the timing.

2. Eliminating Bias: By making the timing markers visible, Yarn removes the "black box" of verification. It ensures that every moderator is holding every runner to the exact same standard, frame-by-frame.

3. Crowdsourced Accuracy: If a mistake is found in a world-record time months later, the Yarn file can be updated and re-verified without needing to re-watch the entire video and re-mark the loads from scratch.

## Shortcuts
Uses standard YouTube shortcuts when possible.

| Key | Action |
| :--- | :--- |
| `Space` / `K` | Play / Pause |
| `.` / `,` | Frame Forward / Backward (1/fps) |
| `L` / `J` | Seek Forward / Backward (10s) |
| `X` / `Z` | Verifier Cycle: Jump to next/prev audit checkpoint |
| `F` | Toggle Fullscreen |
