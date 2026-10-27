import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const { isAuthenticated, authFetch } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist based on auth state
  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        const res = await authFetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setWatchlist(data.items || []);
        }
      } catch (err) {
        console.warn('Failed to fetch user watchlist:', err);
      }
    } else {
      // Guest mode - fetch from localStorage
      try {
        const stored = localStorage.getItem('afterframe_guest_watchlist');
        setWatchlist(stored ? JSON.parse(stored) : []);
      } catch (err) {
        setWatchlist([]);
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, authFetch]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((tmdbId, mediaType = 'movie') => {
    return watchlist.some(
      item => Number(item.tmdbId) === Number(tmdbId) && item.mediaType === mediaType
    );
  }, [watchlist]);

  // Check if item is marked watched
  const isWatched = useCallback((tmdbId, mediaType = 'movie') => {
    return watchlist.some(
      item => Number(item.tmdbId) === Number(tmdbId) && item.mediaType === mediaType && item.status === 'watched'
    );
  }, [watchlist]);

  // Add or toggle in watchlist
  const toggleWatchlist = async (media) => {
    const tmdbId = Number(media.id || media.tmdbId);
    const mediaType = media.media_type || media.mediaType || 'movie';
    const exists = isInWatchlist(tmdbId, mediaType);

    if (exists) {
      // Remove
      if (isAuthenticated) {
        const found = watchlist.find(w => Number(w.tmdbId) === tmdbId && w.mediaType === mediaType);
        if (found?._id) {
          await authFetch(`/api/watchlist/${found._id}`, { method: 'DELETE' });
        }
        setWatchlist(prev => prev.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType)));
      } else {
        const updated = watchlist.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType));
        setWatchlist(updated);
        localStorage.setItem('afterframe_guest_watchlist', JSON.stringify(updated));
      }
    } else {
      // Add
      const newItem = {
        tmdbId,
        mediaType,
        title: media.title || media.name,
        posterPath: media.poster_path || media.posterPath || '',
        backdropPath: media.backdrop_path || media.backdropPath || '',
        releaseDate: media.release_date || media.first_air_date || media.releaseDate || '',
        voteAverage: media.vote_average || media.voteAverage || 0,
        genres: media.genres || [],
        status: 'plan_to_watch'
      };

      if (isAuthenticated) {
        const res = await authFetch('/api/watchlist', {
          method: 'POST',
          body: JSON.stringify(newItem)
        });
        if (res.ok) {
          const data = await res.json();
          setWatchlist(prev => [data.item, ...prev.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType))]);
        }
      } else {
        const updated = [newItem, ...watchlist.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType))];
        setWatchlist(updated);
        localStorage.setItem('afterframe_guest_watchlist', JSON.stringify(updated));
      }
    }
  };

  // Mark as watched
  const markAsWatched = async (media) => {
    const tmdbId = Number(media.id || media.tmdbId);
    const mediaType = media.media_type || media.mediaType || 'movie';

    const newItem = {
      tmdbId,
      mediaType,
      title: media.title || media.name,
      posterPath: media.poster_path || media.posterPath || '',
      backdropPath: media.backdrop_path || media.backdropPath || '',
      releaseDate: media.release_date || media.first_air_date || media.releaseDate || '',
      voteAverage: media.vote_average || media.voteAverage || 0,
      genres: media.genres || [],
      status: 'watched',
      watchedAt: new Date()
    };

    if (isAuthenticated) {
      const res = await authFetch('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(prev => [data.item, ...prev.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType))]);
      }
    } else {
      const updated = [newItem, ...watchlist.filter(w => !(Number(w.tmdbId) === tmdbId && w.mediaType === mediaType))];
      setWatchlist(updated);
      localStorage.setItem('afterframe_guest_watchlist', JSON.stringify(updated));
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        isInWatchlist,
        isWatched,
        toggleWatchlist,
        markAsWatched,
        refreshWatchlist: fetchWatchlist
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
