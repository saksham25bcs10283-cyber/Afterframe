import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function HalfStarRating({
  media,
  initialRating = 0,
  initialSubratings = {},
  initialReview = {},
  onRatingSaved,
  onClose
}) {
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const { markAsWatched } = useWatchlist();

  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSubratings, setShowSubratings] = useState(false);
  const [subratings, setSubratings] = useState({
    plot: initialSubratings?.plot || 8,
    performances: initialSubratings?.performances || 8,
    cinematography: initialSubratings?.cinematography || 8,
    soundtrack: initialSubratings?.soundtrack || 8,
  });
  const [includeSubratings, setIncludeSubratings] = useState(Boolean(initialSubratings?.plot));
  const [reviewTitle, setReviewTitle] = useState(initialReview?.reviewTitle || '');
  const [reviewText, setReviewText] = useState(initialReview?.reviewText || '');
  const [hasSpoiler, setHasSpoiler] = useState(Boolean(initialReview?.hasSpoiler));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState('');

  // 10 half-star steps: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
  const handleStarMouseMove = (starIndex, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = (event.clientX - rect.left) < (rect.width / 2);
    const calculated = isLeftHalf ? starIndex - 0.5 : starIndex;
    setHoverRating(calculated);
  };

  const handleStarClick = (starIndex, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = (event.clientX - rect.left) < (rect.width / 2);
    const calculated = isLeftHalf ? starIndex - 0.5 : starIndex;
    setRating(calculated);
  };

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (rating === 0) {
      setError('Please select at least 0.5 stars for your rating.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      tmdbId: media.id || media.tmdbId,
      mediaType: media.media_type || media.mediaType || 'movie',
      title: media.title || media.name,
      posterPath: media.poster_path || media.posterPath || '',
      releaseDate: media.release_date || media.first_air_date || media.releaseDate || '',
      genres: (media.genres || []).map(g => (typeof g === 'string' ? g : g.name)),
      rating,
      subratings: includeSubratings ? subratings : undefined,
      reviewTitle: reviewTitle.trim(),
      reviewText: reviewText.trim(),
      hasSpoiler
    };

    try {
      const res = await authFetch('/api/community/title/rate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to save rating');
      }

      // Automatically sync watched state in watchlist
      markAsWatched(media);

      setStatusMessage('Rating and review recorded in your AfterFrame diary!');
      if (onRatingSaved) onRatingSaved(data.review);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to save rating. Please ensure MongoDB is connected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-yellow)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          RATE THIS FILM
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{media.title || media.name}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          AfterFrame Half-Star Rating (0.5 to 5.0)
        </p>
      </div>

      {/* Half-Star Rating Control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          margin: '1.25rem 0 0.5rem 0'
        }}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFull = displayRating >= starIdx;
          const isHalf = displayRating === starIdx - 0.5;

          return (
            <div
              key={starIdx}
              onMouseMove={(e) => handleStarMouseMove(starIdx, e)}
              onClick={(e) => handleStarClick(starIdx, e)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-block',
                transition: 'transform 100ms'
              }}
              title={`${starIdx} Stars`}
            >
              {isFull ? (
                <Star size={36} fill="var(--star-gold)" color="var(--star-gold)" />
              ) : isHalf ? (
                <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                  {/* Empty star background */}
                  <Star size={36} color="var(--border-active)" />
                  {/* Half filled overlay */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                    <Star size={36} fill="var(--star-gold)" color="var(--star-gold)" />
                  </div>
                </div>
              ) : (
                <Star size={36} color="var(--border-active)" />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'var(--star-gold)', marginBottom: '1.25rem' }}>
        {displayRating > 0 ? `${displayRating.toFixed(1)} / 5.0` : 'Select your score'}
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem',
          marginBottom: '1rem',
          color: '#f87171',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem',
          marginBottom: '1rem',
          color: '#34d399',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Optional Subratings Drawer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => {
            setShowSubratings(!showSubratings);
            setIncludeSubratings(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}
        >
          <span>Optional Film Aspect Subratings (1–10)</span>
          {showSubratings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showSubratings && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { key: 'plot', label: 'Screenplay & Narrative' },
              { key: 'performances', label: 'Cast Performances' },
              { key: 'cinematography', label: 'Cinematography & Visuals' },
              { key: 'soundtrack', label: 'Score & Sound Design' }
            ].map(aspect => (
              <div key={aspect.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{aspect.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={subratings[aspect.key]}
                    onChange={(e) => setSubratings({ ...subratings, [aspect.key]: Number(e.target.value) })}
                    style={{ accentColor: 'var(--accent-yellow)', width: '100px' }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', width: '22px', textAlign: 'right' }}>
                    {subratings[aspect.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional Review Form */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            placeholder="Review Headline (optional)"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
        <div>
          <textarea
            placeholder="Write your thoughts on this film for the AfterFrame community..."
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="spoiler-check"
            checked={hasSpoiler}
            onChange={(e) => setHasSpoiler(e.target.checked)}
            style={{ accentColor: 'var(--accent-yellow)' }}
          />
          <label htmlFor="spoiler-check" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            This review contains spoilers
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
          style={{ fontSize: '0.82rem', padding: '0.55rem 1.25rem', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Recording...' : 'Submit Rating & Diary'}
        </button>
      </div>
    </div>
  );
}
