import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Search,
  Globe,
  Sun,
  Moon,
  Bookmark,
  Calendar,
  TrendingUp,
  Users,
  Tv,
  X,
  Menu,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useWatchlist } from '../context/WatchlistContext';
import BrandLogo from './BrandLogo';

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuest, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { region, setRegion, currentRegion, allRegions } = useRegion();
  const { watchlist } = useWatchlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestNoticeDismissed, setGuestNoticeDismissed] = useState(false);

  const searchRef = useRef(null);
  const regionRef = useRef(null);
  const userRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (regionRef.current && !regionRef.current.contains(e.target)) {
        setShowRegionMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.results || []).slice(0, 6));
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getImageSrc = (path, size = 'w92') => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=150&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  return (
    <>
      {/* Device-only guest banner notice */}
      {isGuest && !guestNoticeDismissed && (
        <div style={{
          background: 'linear-gradient(90deg, #1f1f23, #2d2a1e)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.4rem 1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
            <Info size={14} color="var(--accent-yellow)" />
            <span>
              <strong>Guest Mode:</strong> Watchlist and diary are saved to this device only.
              <button
                onClick={() => openAuthModal('signup')}
                style={{
                  color: 'var(--accent-yellow)',
                  fontWeight: '700',
                  marginLeft: '0.35rem',
                  textDecoration: 'underline'
                }}
              >
                Sign in to sync across devices & upvote celebrities
              </button>
            </span>
          </div>
          <button
            onClick={() => setGuestNoticeDismissed(true)}
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        transition: 'background-color var(--transition-smooth)'
      }}>
        <div style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0
            }}
            aria-label="AfterFrame — Beyond the Credits"
          >
            <BrandLogo variant="full" size="md" />
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} style={{ flex: '1', maxWidth: '580px', position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search movies, TV shows, actors, directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 2.5rem 0.6rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '2.5rem', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search size={18} />
              </button>
            </form>

            {/* Live Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                zIndex: 100
              }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  SEARCH RESULTS
                </div>
                {searchResults.map((item) => {
                  const isPerson = item.media_type === 'person';
                  const title = item.title || item.name;
                  const date = item.release_date || item.first_air_date;
                  const path = isPerson ? `/person/${item.id}` : (item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`);

                  return (
                    <Link
                      key={`${item.media_type}-${item.id}`}
                      to={path}
                      onClick={() => setShowSearchDropdown(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img
                        src={getImageSrc(item.poster_path || item.profile_path)}
                        alt={title}
                        style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {isPerson ? `Celebrity • ${item.known_for_department || 'Acting'}` : `${item.media_type === 'tv' ? 'TV Series' : 'Movie'} ${date ? `• ${date.slice(0, 4)}` : ''}`}
                        </div>
                      </div>
                      {item.vote_average > 0 && (
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-yellow)' }}>
                          ★ {item.vote_average.toFixed(1)}
                        </div>
                      )}
                    </Link>
                  );
                })}
                <div style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--bg-surface-elevated)' }}>
                  <button
                    onClick={handleSearchSubmit}
                    style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '600' }}
                  >
                    View all results for "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="desktop-nav">
            <Link to="/charts" style={{ fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
              <TrendingUp size={16} color="var(--accent-yellow)" />
              <span>Charts</span>
            </Link>
            <Link to="/people" style={{ fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
              <Users size={16} color="var(--accent-yellow)" />
              <span>People</span>
            </Link>
            <Link to="/gather" style={{ fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
              <Calendar size={16} color="var(--accent-yellow)" />
              <span>Gather</span>
            </Link>
            <Link to="/my-cinema" style={{ fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
              <Bookmark size={16} color="var(--accent-yellow)" />
              <span>My Cinema</span>
              {watchlist.length > 0 && (
                <span style={{
                  background: 'var(--accent-yellow)',
                  color: '#000000',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.1rem 0.4rem',
                  lineHeight: 1
                }}>
                  {watchlist.length}
                </span>
              )}
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Region Selector */}
            <div ref={regionRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRegionMenu(!showRegionMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}
                title="Select Discovery Region"
              >
                <span>{currentRegion.flag}</span>
                <span>{currentRegion.code}</span>
                <ChevronDown size={14} />
              </button>

              {showRegionMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  minWidth: '160px',
                  zIndex: 100,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
                    SELECT REGION
                  </div>
                  {allRegions.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => {
                        setRegion(r.code);
                        setShowRegionMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        color: region === r.code ? 'var(--accent-yellow)' : 'var(--text-primary)',
                        background: region === r.code ? 'var(--accent-yellow-dim)' : 'transparent',
                        fontWeight: region === r.code ? '700' : '500'
                      }}
                    >
                      <span>{r.flag}</span>
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)'
              }}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={17} color="var(--accent-yellow)" /> : <Moon size={17} />}
            </button>

            {/* Auth / Profile */}
            {isAuthenticated ? (
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.6rem 0.25rem 0.35rem'
                  }}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.name}`}
                    alt={user.name}
                    style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    minWidth: '180px',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <Link
                      to="/my-cinema"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <Bookmark size={15} color="var(--accent-yellow)" />
                      <span>My Cinema & Diary</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--danger)',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => openAuthModal('login')}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    padding: '0.45rem 0.85rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
