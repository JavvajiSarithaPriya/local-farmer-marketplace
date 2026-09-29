// This file runs on app startup to clear any corrupted localStorage
if (typeof window !== 'undefined') {
  try {
    // Try to parse user - if it fails, clear localStorage completely
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        JSON.parse(savedUser);
      } catch {
        console.warn("Corrupted localStorage detected, clearing all data...");
        localStorage.clear();
      }
    }
  } catch (error) {
    console.error("Error checking localStorage:", error);
    localStorage.clear();
  }
}
