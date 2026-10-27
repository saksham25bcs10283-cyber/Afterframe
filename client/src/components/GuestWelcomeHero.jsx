import React, { useState } from 'react';
import { Sparkles, Compass, UserCheck, UserPlus, Film, Heart, Shield, X, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * GuestWelcomeHero
 * Polished, cinematic first-time orientation explaining AfterFrame's value proposition:
 * - Discover trending movies, shows and celebrities
 * - Regional discovery (India, US, UK)
 * - Find streaming availability
 * - Maintain watchlist & watched diary
 * - Rate films with half-stars & receive recommendations
 * - Follow celebrities
 * - Organize or join watch parties and theatre outings
 * With prominent "Explore as Guest", "Sign In", and "Create Account" actions.
 */
export default function GuestWelcomeHero() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('af_guest_welcome_dismissed') === 'true';
  });

  if (isAuthenticated || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('af_guest_welcome_dismissed', 'true');
    setDismissed(true);
  };

  const handleExploreGuest = () => {
    handleDismiss();
    window.scrollTo({ top: 480, behavior: 'smooth' });
  };

  return (
    <div style={{
      maxWidth: '1380px',
      margin: '1.25rem auto 1.75rem auto',
      padding: '0 1.25rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 24, 0.95) 0%, rgba(32, 28, 18, 0.9) 100%)',
        border: '1px solid rgba(245, 197, 24, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Subtle decorative gold cinema horizon */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #F5C518, transparent)'
        }} />

        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Dismiss welcome orientation"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              background: 'var(--accent-yellow)',
              color: '#000000',
              fontWeight: 900,
              fontSize: '0.75rem',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.05em'
            }}>
              WELCOME TO AFTERFRAME
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-yellow)', fontWeight: 600 }}>
              The film doesn't end at the credits.
            </span>
          </div>

          {/* Description */}
          <p style={{
            margin: 0,
            fontSize: '0.98rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            maxWidth: '1000px'
          }}>
            Your premium cinephile destination: discover trending movies and series, explore regional cinema across <strong>India, the US and the UK</strong>, find instant streaming availability, curate your personal watchlist and watched diary, rate titles with half-stars, follow your favorite actors & directors, and organize local watch parties and theatre outings.
          </p>

          {/* Feature Highlights Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem',
            marginTop: '0.25rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Compass size={16} color="var(--accent-yellow)" style={{ flexShrink: 0 }} />
              <span>Real TMDB Discovery & Streaming</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Film size={16} color="var(--accent-yellow)" style={{ flexShrink: 0 }} />
              <span>Regional Cinema Filters (IN, US, GB)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Heart size={16} color="var(--accent-yellow)" style={{ flexShrink: 0 }} />
              <span>Independent Celebrity Following & Upvotes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Sparkles size={16} color="var(--accent-yellow)" style={{ flexShrink: 0 }} />
              <span>Explainable Taste Match (X.X/10)</span>
            </div>
          </div>

          {/* Device storage notice & 3 Clear Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} color="var(--accent-yellow)" />
              <span>Guest mode is fully active. Watchlists & diary are stored privately on this device.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleExploreGuest}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Compass size={15} />
                <span>Explore as Guest</span>
              </button>

              <button
                onClick={() => openAuthModal('login')}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}
              >
                <UserCheck size={15} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => openAuthModal('signup')}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={15} />
                <span>Create Free Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
