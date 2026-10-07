import { createContext, useContext, useMemo, useState } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [drafts, setDrafts] = useState({});

  function updateDraft(movieId, changes) {
    setDrafts((current) => ({
      ...current,
      [movieId]: { ...current[movieId], ...changes }
    }));
  }

  function clearDraft(movieId) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[movieId];
      return next;
    });
  }

  const value = useMemo(() => ({ drafts, updateDraft, clearDraft }), [drafts]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider.");
  }
  return context;
}
