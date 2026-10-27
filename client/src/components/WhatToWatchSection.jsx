import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Bookmark, Plus, Check, Star, Eye } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import HalfStarRating from './HalfStarRating';
import ImageWithFallback from './ImageWithFallback';

export default function WhatToWatchSection({ top10Movies = [] }) {
  const navigate = useNavigate();
  const { isInWatchlist, isWatched, toggleWatchlist, markAsWatched } = useWatchlist();
  const [ratingModalMovie, setRatingModalMovie] = useState(null);

  const top3 = top10Movies.slice(0, 3);
  const remaining = top10Movies.slice(3, 10);

  const getPoster = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const formatRelease = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return date;
    }
  };

  return (
    <section style={{ maxWidth: '1380px', margin: '0 auto 3rem auto', padding: '0 1.25rem' }}>
      {/* Primary Section Header: | What to watch */}
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-bar" />
          <h2 className="section-title" style={{ fontSize: '1.75rem' }}>
            What to watch
          </h2>
        </div>
        <Link to="/charts" className="section-action-link">
          <span>Get more recommendations</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Subheading: | Top 10 on AfterFrame this week > (Accurately labeled Global Weekly Trending) */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div className="section-title-wrap">
          <div className="section-bar" style={{ height: '1.3rem' }} />
          <Link to="/charts" className="section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Top 10 on AfterFrame this week</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              (Global Weekly Trending)
            </span>
            <ChevronRight className="section-chevron" />
          </Link>
        </div>
      </div>

      {/* Top 3 Featured Highlight Cards (Matches Screenshot 2) */}
      <div className="top-featured-grid">
        {top3.map((movie, idx) => {
          const rank = idx + 1;
          const inWatchlist = isInWatchlist(movie.id, movie.media_type || 'movie');
          const watched = isWatched(movie.id, movie.media_type || 'movie');
          const isTv = movie.media_type === 'tv';
          const title = movie.title || movie.name;
          const releaseText = isTv
            ? `TV Series  ${(movie.first_air_date || '').slice(0, 4)}–  ${movie.number_of_episodes || 9} eps  ${movie.certification || '15'}`
            : `Releases ${formatRelease(movie.release_date)}  ${movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '1h 48m'}  ${movie.certification || '18'}`;

          return (
            <div
              key={movie.id}
              onClick={() => navigate(isTv ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
              className="highlight-movie-card"
              style={{ cursor: 'pointer' }}
            >
              {/* Poster with Bookmark */}
              <div className="highlight-poster-wrap">
                <ImageWithFallback
                  src={getPoster(movie.poster_path)}
                  alt={title}
                  title={title}
                  type="poster"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlist(movie);
                  }}
                  className={`watchlist-bookmark-btn ${inWatchlist ? 'active' : ''}`}
                  title={inWatchlist ? 'In your Watchlist' : 'Add to Watchlist'}
                  aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {inWatchlist ? <Check size={18} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
                </button>
              </div>

              {/* Card Body */}
              <div className="highlight-content">
                <div className="highlight-meta-row">
                  <span className="rank-badge">#{rank}</span>
                </div>

                <div
                  className="highlight-title"
                  title={title}
                >
                  {title}
                </div>

                <div className="highlight-details-line">
                  {releaseText}
                </div>

                {/* Rating & Rate Action */}
                <div className="highlight-rating-row" onClick={(e) => e.stopPropagation()}>
                  <div className="rating-star-pill">
                    <Star size={14} fill="var(--star-gold)" color="var(--star-gold)" />
                    <span>{movie.vote_average ? movie.vote_average.toFixed(1) : '8.0'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.75rem' }}>
                      ({movie.vote_count ? `${Math.round(movie.vote_count / 1000)}K` : '18K'})
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRatingModalMovie(movie);
                    }}
                    className="rating-rate-btn"
                    title={`Rate ${title}`}
                  >
                    <Star size={13} />
                    <span>Rate</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsWatched(movie);
                    }}
                    style={{
                      fontSize: '0.8rem',
                      color: watched ? 'var(--success)' : 'var(--accent-blue)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginLeft: 'auto',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title="Mark as watched"
                  >
                    <Eye size={13} />
                    <span>{watched ? 'Watched' : 'Mark as watched'}</span>
                  </button>
                </div>

                {/* Overview Snippet */}
                <p className="highlight-overview">
                  {movie.overview}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked Cards #4 through #10 (Matches Screenshot 2 Bottom Row) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '1rem'
      }}>
        {remaining.map((movie, idx) => {
          const rank = idx + 4;
          const inWatchlist = isInWatchlist(movie.id, movie.media_type || 'movie');
          const isTv = movie.media_type === 'tv';
          const title = movie.title || movie.name;

          return (
            <div
              key={movie.id}
              onClick={() => navigate(isTv ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
              className="movie-compact-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="movie-compact-poster-wrap">
                {/* Rank Badge #4, #5, etc. */}
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 6 }}>
                  <span className="rank-badge" style={{ borderRadius: '0 0 var(--radius-sm) 0' }}>
                    #{rank}
                  </span>
                </div>

                <ImageWithFallback
                  src={getPoster(movie.poster_path)}
                  alt={title}
                  title={title}
                  type="poster"
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlist(movie);
                  }}
                  className={`watchlist-bookmark-btn ${inWatchlist ? 'active' : ''}`}
                  style={{ top: 0, right: 0, left: 'auto', borderRadius: '0 0 0 var(--radius-sm)' }}
                  title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {inWatchlist ? <Check size={16} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                </button>
              </div>

              <div className="movie-compact-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '700' }}>
                  <Star size={12} fill="var(--star-gold)" color="var(--star-gold)" />
                  <span>{movie.vote_average ? movie.vote_average.toFixed(1) : '7.5'}</span>
                </div>
                <div
                  className="movie-compact-title"
                  title={title}
                >
                  {title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating Modal Dialog */}
      {ratingModalMovie && (
        <div className="modal-backdrop" onClick={() => setRatingModalMovie(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <HalfStarRating
              media={ratingModalMovie}
              onClose={() => setRatingModalMovie(null)}
              onRatingSaved={() => setRatingModalMovie(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
