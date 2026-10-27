import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Bookmark,
  Plus,
  Check,
  Eye,
  Play,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronRight,
  MessageSquare,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import HalfStarRating from '../components/HalfStarRating';
import TrailerModal from '../components/TrailerModal';
import ImageWithFallback from '../components/ImageWithFallback';
import TasteMatchBadge from '../components/TasteMatchBadge';

export default function DetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isTv = location.pathname.startsWith('/tv');
  const mediaType = isTv ? 'tv' : 'movie';

  const { region, currentRegion } = useRegion();
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const { isInWatchlist, isWatched, toggleWatchlist, markAsWatched } = useWatchlist();

  const [details, setDetails] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [reviewPulse, setReviewPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [id, mediaType, region]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailRes, statsRes, pulseRes] = await Promise.all([
        fetch(`/api/tmdb/${mediaType}/${id}`),
        fetch(`/api/community/title/${id}/stats?mediaType=${mediaType}`),
        fetch(`/api/community/title/${id}/pulse?mediaType=${mediaType}`)
      ]);

      if (detailRes.ok) {
        const dJson = await detailRes.json();
        setDetails(dJson.data || dJson);
      }
      if (statsRes.ok) {
        const sJson = await statsRes.json();
        setCommunityStats(sJson);
      }
      if (pulseRes.ok) {
        const pJson = await pulseRes.json();
        setReviewPulse(pJson);
      }
    } catch (err) {
      console.warn('Failed to load title details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading cinematic presentation...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Title Not Found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Home</Link>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(details.id, mediaType);
  const watched = isWatched(details.id, mediaType);

  const title = details.title || details.name;
  const releaseDate = details.release_date || details.first_air_date;
  const year = releaseDate ? releaseDate.slice(0, 4) : '';
  const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.number_of_seasons ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}` : '');
  const trailerVideo = details.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
    || details.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Teaser')
    || details.videos?.results?.find(v => v.site === 'YouTube');

  // Streaming Watch Providers strictly for selected Region (no region cross-contamination)
  const providersData = details['watch/providers']?.results?.[region];
  const streamProviders = providersData?.flatrate || [];
  const rentProviders = providersData?.rent || [];
  const buyProviders = providersData?.buy || [];
  const justWatchLink = providersData?.link || `https://www.justwatch.com/${region.toLowerCase()}/search?q=${encodeURIComponent(title)}`;

  const getBackdrop = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/original${path}`;
  };

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getProviderLogo = (path) => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w92${path}`;
  };

  return (
    <div>
      {/* 1. Backdrop Hero Banner */}
      <div style={{
        position: 'relative',
        minHeight: '440px',
        background: '#09090b',
        display: 'flex',
        alignItems: 'flex-end',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        <img
          src={getBackdrop(details.backdrop_path)}
          alt={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            filter: 'brightness(0.55)'
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(14,14,16,0.2) 0%, rgba(14,14,16,0.85) 75%, var(--bg-primary) 100%)'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1380px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 1.25rem 1.5rem 1.25rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-end'
        }} className="detail-hero-content">
          {/* Poster Card */}
          <div style={{
            width: '200px',
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            border: '2px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}>
            <img src={getPoster(details.poster_path)} alt={title} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          {/* Title & Metadata */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'var(--accent-yellow)',
                color: '#000000',
                fontSize: '0.72rem',
                fontWeight: '900',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                {mediaType === 'tv' ? 'TV SERIES' : 'MOVIE'}
              </span>
              {year && <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{year}</span>}
              {runtime && <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>• {runtime}</span>}
              <TasteMatchBadge mediaType={mediaType} tmdbId={details.id} size="sm" />
            </div>

            <h1 style={{ fontSize: '2.6rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.15, marginBottom: '0.5rem' }}>
              {title}
            </h1>

            {details.tagline && (
              <p style={{ fontStyle: 'italic', color: 'var(--accent-yellow)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                "{details.tagline}"
              </p>
            )}

            {/* Genres */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {(details.genres || []).map(g => (
                <span
                  key={g.id || g}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {g.name || g}
                </span>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowTrailerModal(true)}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                <Play size={17} fill="#000000" />
                <span>Watch Trailer</span>
              </button>

              <button
                onClick={() => toggleWatchlist({ ...details, mediaType })}
                className="btn-secondary"
                style={{
                  background: inWatchlist ? 'var(--accent-yellow-dim)' : 'var(--bg-surface-elevated)',
                  borderColor: inWatchlist ? 'var(--accent-yellow)' : 'var(--border-subtle)',
                  color: inWatchlist ? 'var(--accent-yellow)' : 'var(--text-primary)'
                }}
              >
                <Bookmark size={16} fill={inWatchlist ? 'var(--accent-yellow)' : 'none'} />
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={() => markAsWatched({ ...details, mediaType })}
                className="btn-secondary"
                style={{
                  background: watched ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                  borderColor: watched ? 'var(--success)' : 'var(--border-subtle)',
                  color: watched ? 'var(--success)' : 'var(--text-primary)'
                }}
              >
                <Eye size={16} />
                <span>{watched ? 'Watched' : 'Mark Watched'}</span>
              </button>

              <button
                onClick={() => setShowRatingModal(true)}
                className="btn-secondary"
                style={{ color: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow-dim)' }}
              >
                <Star size={16} />
                <span>Rate Film</span>
              </button>

              <Link
                to={`/gather?movie=${details.id}&title=${encodeURIComponent(title)}`}
                className="btn-secondary"
                style={{ color: 'var(--accent-blue)' }}
              >
                <Users size={16} />
                <span>Host Cinema Outing</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div style={{
        maxWidth: '1380px',
        margin: '2rem auto',
        padding: '0 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: '2.5rem'
      }} className="detail-body-grid">
        {/* Left Column: Synopsis, Ratings Comparison, Cast, Community Reviews */}
        <div>
          {/* Dual Rating Score Block (TMDB vs AfterFrame) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* TMDB Aggregate Rating */}
            <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                TMDB AGGREGATE RATING
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={28} fill="var(--star-gold)" color="var(--star-gold)" />
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1 }}>
                    {details.vote_average ? details.vote_average.toFixed(1) : '7.9'}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}> / 10</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {details.vote_count ? `${details.vote_count.toLocaleString()} votes` : 'Global score'}
                  </div>
                </div>
              </div>
            </div>

            {/* AfterFrame Community Rating */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-yellow)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                AFTERFRAME COMMUNITY RATING
              </div>
              {communityStats?.hasCommunityReviews ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={28} fill="var(--accent-yellow)" color="var(--accent-yellow)" />
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1 }}>
                      {communityStats.afterframe_avg_rating}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}> / 5.0</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Based on {communityStats.afterframe_vote_count} member review{communityStats.afterframe_vote_count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    No community reviews yet.
                  </div>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '700', textDecoration: 'underline' }}
                  >
                    Be the first to rate on AfterFrame!
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Synopsis */}
          <section style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-bar" />
                <h2 className="section-title">Storyline</h2>
              </div>
            </div>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {details.overview || 'No storyline synopsis currently available for this title.'}
            </p>
          </section>

          {/* Cast Carousel */}
          {details.credits?.cast?.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <div className="section-header">
                <div className="section-title-wrap">
                  <div className="section-bar" />
                  <h2 className="section-title">Top Cast</h2>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
                scrollbarWidth: 'none'
              }}>
                {details.credits.cast.slice(0, 10).map(actor => (
                  <Link
                    key={actor.id}
                    to={`/person/${actor.id}`}
                    style={{
                      flex: '0 0 110px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={actor.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--border-subtle)',
                        marginBottom: '0.4rem'
                      }}
                      loading="lazy"
                    />
                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {actor.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {actor.character}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Review Pulse (Deterministic keyword frequency & genuine stats, NO fake AI) */}
          {reviewPulse && (
            <section style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '2.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sparkles size={18} color="var(--accent-yellow)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Review Pulse</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Sample size: {reviewPulse.sampleSize} verified review{reviewPulse.sampleSize === 1 ? '' : 's'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Deterministic keyword frequency generated from verified TMDB and AfterFrame reviews.
              </p>
              {reviewPulse.frequentKeywords?.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {reviewPulse.frequentKeywords.map(kw => (
                    <span
                      key={kw.keyword}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>#{kw.keyword}</span>
                      <span style={{ color: 'var(--accent-yellow)', fontSize: '0.72rem' }}>({kw.count})</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Awaiting additional reviews to establish distinct pulse keywords.
                </p>
              )}
            </section>
          )}

          {/* AfterFrame Community Reviews Section */}
          <section>
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-bar" />
                <h2 className="section-title">Community Reviews</h2>
              </div>
              <button
                onClick={() => setShowRatingModal(true)}
                className="btn-primary"
                style={{ fontSize: '0.82rem' }}
              >
                Write a Review
              </button>
            </div>

            {communityStats?.reviews?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {communityStats.reviews.map(rev => (
                  <div
                    key={rev._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                          src={rev.userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${rev.userName}`}
                          alt={rev.userName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{rev.userName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Half-Star Rating Badge */}
                      <div style={{
                        background: 'var(--accent-yellow-dim)',
                        color: 'var(--accent-yellow)',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Star size={13} fill="currentColor" />
                        <span>{rev.rating.toFixed(1)} / 5.0</span>
                      </div>
                    </div>

                    {rev.reviewTitle && (
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                        {rev.reviewTitle}
                      </h4>
                    )}

                    {rev.hasSpoiler && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#f87171',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginBottom: '0.35rem'
                      }}>
                        <AlertTriangle size={13} />
                        <span>Contains Spoilers</span>
                      </div>
                    )}

                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      {rev.reviewText || 'Rated without written text.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <MessageSquare size={32} color="var(--text-muted)" />
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>No Community Reviews Yet</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
                  Share your cinematic perspective with the AfterFrame community.
                </p>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn-primary"
                  style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}
                >
                  Write First Review
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Streaming Availability, Production Info */}
        <div>
          {/* Where to Stream (JustWatch Attribution) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div className="section-title-wrap">
                <div className="section-bar" style={{ height: '1.2rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Where to Watch</h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{currentRegion?.flag}</span>
                <span>{currentRegion?.name || region}</span>
              </span>
            </div>

            {streamProviders.length > 0 || rentProviders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {streamProviders.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Subscription Stream ({streamProviders.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {streamProviders.map(p => (
                        <a
                          key={p.provider_id}
                          href={justWatchLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Watch ${title} on ${p.provider_name} in ${currentRegion?.name || region}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            background: 'var(--bg-surface-elevated)',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            transition: 'all var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-yellow)';
                            e.currentTarget.style.background = 'var(--bg-card-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                          }}
                        >
                          <img
                            src={getProviderLogo(p.logo_path)}
                            alt={p.provider_name}
                            style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                          />
                          <span style={{ fontWeight: '600' }}>{p.provider_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginLeft: '0.2rem' }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {rentProviders.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Rent or Buy ({rentProviders.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {rentProviders.slice(0, 6).map(p => (
                        <a
                          key={p.provider_id}
                          href={justWatchLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Rent/Buy ${title} on ${p.provider_name} in ${currentRegion?.name || region}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            background: 'var(--bg-surface-elevated)',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            transition: 'all var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-yellow)';
                            e.currentTarget.style.background = 'var(--bg-card-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                          }}
                        >
                          <img
                            src={getProviderLogo(p.logo_path)}
                            alt={p.provider_name}
                            style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                          />
                          <span style={{ fontWeight: '600' }}>{p.provider_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginLeft: '0.2rem' }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Streaming availability powered by JustWatch for {currentRegion?.name || region}.</span>
                  <a href={justWatchLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-yellow)', textDecoration: 'none' }}>
                    View on JustWatch ↗
                  </a>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                padding: '1.25rem',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-secondary)' }}>
                  No active streaming providers currently reported in {currentRegion?.name || region} ({region}).
                </p>
                <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.75rem' }}>
                  Theatrical run, regional rights pending, or physical release.
                </p>
                <a
                  href={`https://www.justwatch.com/${region.toLowerCase()}/search?q=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent-blue)',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>Check JustWatch directory for {currentRegion?.name || region}</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Cinema Gather Outing Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(87,153,239,0.1), rgba(245,197,24,0.1))',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.35rem' }}>
              Watch {title} with Friends
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Organize a local theatre outing or virtual watch party through AfterFrame Gather.
            </p>
            <Link
              to={`/gather?movie=${details.id}&title=${encodeURIComponent(title)}`}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              Host Gather Outing
            </Link>
          </div>
        </div>
      </div>

      {/* Half-Star Rating Modal */}
      {showRatingModal && (
        <div className="modal-backdrop" onClick={() => setShowRatingModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <HalfStarRating
              media={details}
              initialRating={communityStats?.user_rating_record?.rating}
              initialSubratings={communityStats?.user_rating_record?.subratings}
              initialReview={communityStats?.user_rating_record}
              onClose={() => setShowRatingModal(false)}
              onRatingSaved={() => {
                fetchData();
                setShowRatingModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailerModal && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          videoKey={trailerVideo?.key || null}
          title={`${title} — Trailer`}
        />
      )}
    </div>
  );
}
