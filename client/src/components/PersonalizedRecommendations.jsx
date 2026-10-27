import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Bookmark, Plus, Check, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import TasteMatchBadge from './TasteMatchBadge';

export default function PersonalizedRecommendations() {
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/community/recommendations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Failed to load personalized recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  return (
    <section style={{ maxWidth: '1380px', margin: '0 auto 3rem auto', padding: '0 1.25rem' }}>
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-bar" />
          <h2 className="section-title">
            <span>Personalized for You</span>
            <Sparkles size={18} color="var(--accent-yellow)" />
          </h2>
        </div>
      </div>

      {(!isAuthenticated || (data && !data.eligible)) ? (
        /* The Mandatory Playful Empty State for New Users */
        <div className="empty-state-box">
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--accent-yellow-dim)',
            color: 'var(--accent-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={28} />
          </div>
          <h3 className="empty-state-title">
            “Your taste is still in the opening credits.”
          </h3>
          <p className="empty-state-subtext">
            “Rate three movies and AfterFrame will start learning what you love.”
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <Link to="/charts" className="btn-primary" style={{ fontSize: '0.85rem' }}>
              Explore Trending Films to Rate
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => openAuthModal('signup')}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Explainable Recommendations */
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--accent-yellow)', fontWeight: '600', marginBottom: '1rem' }}>
            {data.explanation}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.25rem'
          }}>
            {(data.recommendations || []).map((movie) => {
              const inWatchlist = isInWatchlist(movie.id, 'movie');
              return (
                <div key={movie.id} className="movie-compact-card">
                  <div className="movie-compact-poster-wrap">
                    <img
                      src={getPoster(movie.poster_path)}
                      alt={movie.title}
                      className="movie-compact-poster"
                      loading="lazy"
                    />
                    <button
                      onClick={() => toggleWatchlist(movie)}
                      className={`watchlist-bookmark-btn ${inWatchlist ? 'active' : ''}`}
                      title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <Check size={16} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                    </button>
                  </div>
                  <div className="movie-compact-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '700' }}>
                        <Star size={12} fill="var(--star-gold)" color="var(--star-gold)" />
                        <span>{movie.vote_average ? movie.vote_average.toFixed(1) : '7.5'}</span>
                      </div>
                      <TasteMatchBadge
                        mediaType="movie"
                        tmdbId={movie.id}
                        initialData={movie.tasteMatch}
                        size="sm"
                      />
                    </div>
                    <Link to={`/movie/${movie.id}`} className="movie-compact-title">
                      {movie.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
