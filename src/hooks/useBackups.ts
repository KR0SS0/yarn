import { useEffect, useState, useCallback } from "react";

export const useBackups = (
  currentData: any,
  author: string, 
  intervalMs: number = 200000,
) => {
  const [backups, setBackups] = useState<any[]>([]);

  // Load existing backups on mount
  useEffect(() => {
    const saved = localStorage.getItem("yarn_backups");
    if (saved) {
      try { setBackups(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const createBackup = useCallback(() => {
    if (!currentData.videoId) return;

    const validLoadsCount = currentData.loads.filter(
      (l: any) => l.startTime !== null || l.endTime !== null,
    ).length;

    const labelName = `${author}, ${currentData.videoId}, ${validLoadsCount} loads`;

    const newBackup = {
      id: Date.now(),
      label: labelName,
      timestamp: new Date().toLocaleString(),
      data: { ...currentData },
    };

    setBackups((prev) => {
      const updated = [newBackup, ...prev].slice(0, 10);
      localStorage.setItem("yarn_backups", JSON.stringify(updated));
      return updated;
    });
  }, [currentData, author]); // Depend on author string

  useEffect(() => {
    const timer = setInterval(createBackup, intervalMs);
    return () => clearInterval(timer);
  }, [createBackup, intervalMs]);

  return { backups, createBackup };
};