import React, { useState, useEffect } from 'react';
import { Sparkles, Info, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * TasteMatchBadge
 * Unobtrusive compatibility badge displaying "Your Match: X.X/10"
 * Clicking opens an explainable breakdown modal with verified factors.
 */
export default function TasteMatchBadge({
  mediaType = 'movie',
  tmdbId,
  initialData = null,
  size = 'md',
  style = {}
}) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [matchData, setMatchData] = useState(initialData);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData && Boolean(tmdbId) && isAuthenticated);

  useEffect(() => {
    if (initialData) {
      setMatchData(initialData);
      return;
    }
    if (!tmdbId || !isAuthenticated) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/community/taste-match/${mediaType}/${tmdbId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setMatchData(data);
        }
      })
      .catch((err) => console.warn('Taste Match fetch error:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, mediaType, initialData, isAuthenticated]);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setShowModal(true);
  };

  // If user is guest
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={handleClick}
          title="Sign in to view your personalized Taste Match"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: size === 'sm' ? '0.2rem 0.5rem' : '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-muted)',
            fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            ...style
          }}
        >
          <Sparkles size={size === 'sm' ? 12 : 14} color="var(--accent-yellow)" />
          <span>Taste Match</span>
        </button>
      </>
    );
  }

  // If still building
  if (matchData?.status === 'building') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Click to learn how Taste Match works"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: size === 'sm' ? '0.2rem 0.5rem' : '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 197, 24, 0.08)',
            border: '1px solid rgba(245, 197, 24, 0.25)',
            color: 'var(--accent-yellow)',
            fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            ...style
          }}
        >
          <Sparkles size={size === 'sm' ? 12 : 14} />
          <span>Building Taste Profile</span>
        </button>

        {showModal && renderExplanationModal(matchData, () => setShowModal(false))}
      </>
    );
  }

  const score = matchData?.score;
  if (!score && !isLoading) return null;

  return (
    <>
      <button
        onClick={handleClick}
        title="Click for Taste Match calculation breakdown"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '0.2rem 0.55rem' : '0.32rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, rgba(245, 197, 24, 0.18) 0%, rgba(212, 175, 55, 0.08) 100%)',
          border: '1px solid rgba(245, 197, 24, 0.45)',
          color: 'var(--accent-yellow)',
          fontSize: size === 'sm' ? '0.74rem' : '0.82rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.15s ease',
          ...style
        }}
      >
        <Sparkles size={size === 'sm' ? 13 : 15} color="var(--accent-yellow)" />
        <span>Your Match: {isLoading ? '...' : `${score}/10`}</span>
      </button>

      {showModal && renderExplanationModal(matchData, () => setShowModal(false))}
    </>
  );
}

function renderExplanationModal(matchData, onClose) {
  const isBuilding = matchData?.status === 'building';
  const score = matchData?.score;
  const breakdowns = matchData?.breakdowns || [];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{
                background: 'var(--accent-yellow)',
                color: '#000000',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 900,
                fontSize: '0.8rem'
              }}>
                TASTE MATCH
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {isBuilding ? 'Building Your Taste Profile' : `Your Match: ${score}/10`}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Explainable cinema compatibility derived deterministically from your actual profile.
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {isBuilding ? (
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              {matchData.message || 'Building your taste profile'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {matchData.subtext || 'Add genre preferences or rate three movies to unlock your personalized Taste Match score.'}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              Active Match Factors
            </div>
            {breakdowns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {breakdowns.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                        {b.factor}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.text}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--accent-yellow)',
                      background: 'rgba(245, 197, 24, 0.12)',
                      padding: '0.2rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0
                    }}>
                      {b.impact}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                General catalog alignment with your baseline profile.
              </p>
            )}
          </div>
        )}

        {/* Factor Weights Overview */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 0.85rem',
          marginBottom: '1.25rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Weighting Scheme:</strong> Genres (40%), Language & Regional (20%), Viewing Style (15%), Followed Talent (15%), Ratings History (10%). Scores are automatically normalized when signals are missing.
        </div>

        {/* Non-dogmatic Disclaimer */}
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          lineHeight: 1.45,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.85rem'
        }}>
          {matchData?.disclaimer || 'Your Match score reflects compatibility with your saved preferences and ratings. It is not an assessment of movie quality or a guarantee of enjoyment.'}
        </div>
      </div>
    </div>
  );
}
