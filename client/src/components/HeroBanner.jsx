import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, Star, ChevronRight, Info } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import TrailerModal from './TrailerModal';
import ImageWithFallback from './ImageWithFallback';

export default function HeroBanner({ featuredMovie, railMovies = [] }) {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [activeMovie, setActiveMovie] = useState(featuredMovie);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  const movie = activeMovie || featuredMovie;
  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id, movie.media_type || 'movie');

  const handleOpenTrailer = async (e) => {
    e?.stopPropagation();
    setTrailerOpen(true);
    setLoadingTrailer(true);
    try {
      const type = movie.media_type === 'tv' ? 'tv' : 'movie';
      const res = await fetch(`/api/tmdb/${type}/${movie.id}/trailer`);
      if (res.ok) {
        const data = await res.json();
        setTrailerKey(data.videoKey || null);
      }
    } catch (err) {
      console.warn('Failed to load trailer:', err);
    } finally {
      setLoadingTrailer(false);
    }
  };

  const getBackdrop = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/original${path}`;
  };

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w300${path}`;
  };

  const releaseYear = (movie.release_date || movie.first_air_date || '').slice(0, 4);

  return (
    <>
      <div style={{
        maxWidth: '1380px',
        margin: '1.25rem auto 2.5rem auto',
        padding: '0 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '1.5rem',
      }} className="hero-grid-container">
        {/* Large Cinematic Hero Panel */}
        <div
          onClick={() => navigate(movie.media_type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            minHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: '#0a0a0c',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            cursor: 'pointer'
          }}
          className="hero-main-card"
        >
          {/* Backdrop Image */}
          <img
            src={getBackdrop(movie.backdrop_path)}
            alt={movie.title || movie.name}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80';
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              filter: 'brightness(0.7)'
            }}
          />

          {/* Gradients to guarantee readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(14,14,16,0.1) 0%, rgba(14,14,16,0.4) 40%, rgba(14,14,16,0.95) 100%)'
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(14,14,16,0.85) 0%, rgba(14,14,16,0.2) 60%, transparent 100%)'
          }} />

          {/* Content Overlay */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '2.5rem 2rem 2rem 2rem',
            maxWidth: '720px'
          }}>
            {/* Tagline / Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
              <span style={{
                background: 'var(--accent-yellow)',
                color: '#000000',
                fontSize: '0.72rem',
                fontWeight: '900',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                FEATURED SPOTLIGHT
              </span>
              {releaseYear && (
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>
                  {releaseYear}
                </span>
              )}
              {movie.vote_average > 0 && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--star-gold)'
                }}>
                  <Star size={14} fill="var(--star-gold)" />
                  {movie.vote_average.toFixed(1)}
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '400', fontSize: '0.75rem' }}>
                    ({(movie.vote_count / 1000).toFixed(0)}K)
                  </span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '900',
              lineHeight: 1.15,
              marginBottom: '0.75rem',
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {movie.title || movie.name}
            </h1>

            {/* Overview */}
            <p style={{
              fontSize: '0.92rem',
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: '1.5rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {movie.overview}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleOpenTrailer}
                className="btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.9rem' }}
                disabled={loadingTrailer}
              >
                <Play size={18} fill="#000000" />
                <span>{loadingTrailer ? 'Loading Trailer...' : 'Watch Trailer'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(movie);
                }}
                className="btn-secondary"
                style={{
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.9rem',
                  background: inWatchlist ? 'var(--accent-yellow-dim)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: inWatchlist ? 'var(--accent-yellow)' : 'rgba(255, 255, 255, 0.25)',
                  color: inWatchlist ? 'var(--accent-yellow)' : '#ffffff',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Bookmark size={17} fill={inWatchlist ? 'var(--accent-yellow)' : 'none'} />
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(movie.media_type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`);
                }}
                className="btn-secondary"
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff'
                }}
              >
                <Info size={17} />
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Rail: Up Next / Trending Compact Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.9rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.02em', color: 'var(--accent-yellow)' }}>
              UP NEXT & TRENDING
            </span>
            <Link to="/charts" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: '600' }}>
              View all
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0.5rem 0' }}>
            {railMovies.slice(0, 4).map((item, idx) => {
              const isSelected = movie.id === item.id;
              const itemYear = (item.release_date || item.first_air_date || '').slice(0, 4);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveMovie(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-yellow)' : '3px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-elevated)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <img
                    src={getPoster(item.poster_path)}
                    alt={item.title || item.name}
                    style={{
                      width: '46px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '0.2rem'
                    }}>
                      {item.title || item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      {itemYear ? `${itemYear} • ` : ''}{item.media_type === 'tv' ? 'Series' : 'Film'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--star-gold)' }}>
                      <Star size={12} fill="var(--star-gold)" />
                      <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.8'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        videoKey={trailerKey}
        title={`${movie.title || movie.name} — Official Trailer`}
      />
    </>
  );
}
