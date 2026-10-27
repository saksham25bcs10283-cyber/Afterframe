import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '3rem 1.5rem 2rem 1.5rem',
      marginTop: '4rem',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem'
    }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <BrandLogo variant="full" size="md" />
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              The film doesn't end at the credits. Discovery, regional charts, half-star community diary, and theatre outings.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Beyond the Credits • Non-commercial cinephile community platform.
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Explore
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/charts" style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }} onMouseEnter={e => e.target.style.color = 'var(--accent-yellow)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>Top 100 & Weekly Trending</Link></li>
              <li><Link to="/people" style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }} onMouseEnter={e => e.target.style.color = 'var(--accent-yellow)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>Trending People & Votes</Link></li>
              <li><Link to="/gather" style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }} onMouseEnter={e => e.target.style.color = 'var(--accent-yellow)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>Gather Movie Outings</Link></li>
              <li><Link to="/my-cinema" style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }} onMouseEnter={e => e.target.style.color = 'var(--accent-yellow)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>My Cinema & Diary</Link></li>
            </ul>
          </div>

          {/* Attributions Mandatory Box */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--accent-yellow)" />
              <span>Data & API Attribution</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              This product uses the TMDB API but is not endorsed or certified by TMDB. Movie, TV, and celebrity metadata are sourced from The Movie Database.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Streaming availability data is powered by JustWatch.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} AfterFrame Inc. All rights reserved.
          </div>
          <div>
            Crafted for movie lovers worldwide • Designed with cinema aesthetics
          </div>
        </div>
      </div>
    </footer>
  );
}
