import { useEffect, useState, useCallback } from "react";

export const useBackups = (currentData: any, intervalMs: number = 200000) => {
  const [backups, setBackups] = useState<any[]>([]);

  // Load existing backups on mount
  useEffect(() => {
    const saved = localStorage.getItem("yarn_backups");
    if (saved) setBackups(JSON.parse(saved));
  }, []);

  const createBackup = useCallback(() => {
    // Validation: Don't backup if no video is loaded or no data exists
    if (!currentData.videoId) return;

    const newBackup = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      data: { ...currentData },
    };

    const savedBackupsAmount = 10;

    setBackups((prev) => {
      const updated = [newBackup, ...prev].slice(0, savedBackupsAmount);
      localStorage.setItem("yarn_backups", JSON.stringify(updated));
      return updated;
    });
    
    console.log("Autosave: Backup created at", newBackup.timestamp);
  }, [currentData]);

  // The Timer
  useEffect(() => {
    const timer = setInterval(createBackup, intervalMs);
    return () => clearInterval(timer);
  }, [createBackup, intervalMs]);

  return { backups, createBackup };
};