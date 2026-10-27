import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Eye,
  Star,
  BarChart2,
  Calendar,
  Filter,
  Trash2,
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

export default function MyCinemaPage() {
  const { watchlist, isWatched, markAsWatched, toggleWatchlist } = useWatchlist();
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'watched' | 'ratings' | 'stats'
  const [filterSearch, setFilterSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [userRatings, setUserRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRatingsAndStats();
    }
  }, [isAuthenticated]);

  const fetchRatingsAndStats = async () => {
    setLoadingRatings(true);
    try {
      const [statsRes] = await Promise.all([
        authFetch('/api/watchlist/stats')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Failed to load cinema stats:', err);
    } finally {
      setLoadingRatings(false);
    }
  };

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Filter items based on activeTab
  const currentItems = watchlist.filter(item => {
    if (activeTab === 'watchlist') return item.status === 'plan_to_watch' || !item.status;
    if (activeTab === 'watched') return item.status === 'watched';
    return true;
  });

  const filteredList = currentItems.filter(item => {
    const matchesSearch = !filterSearch || (item.title || '').toLowerCase().includes(filterSearch.toLowerCase().trim());
    const matchesGenre = !filterGenre || (item.genres || []).includes(filterGenre);
    return matchesSearch && matchesGenre;
  });

  const planToWatchCount = watchlist.filter(w => w.status !== 'watched').length;
  const watchedCount = watchlist.filter(w => w.status === 'watched').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.25rem' }}>
      {/* Page Title */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-wrap">
          <div className="section-bar" style={{ height: '2rem' }} />
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
              My Cinema
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your personal film diary, watchlist, ratings, and viewing analytics
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { key: 'watchlist', label: `Watchlist (${planToWatchCount})`, icon: Bookmark },
          { key: 'watched', label: `Watched Diary (${watchedCount})`, icon: Eye },
          { key: 'stats', label: 'Personal Statistics', icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.15rem',
                fontSize: '0.88rem',
                fontWeight: '700',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--accent-yellow)' : '3px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-yellow)' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content for Watchlist & Watched Tabs */}
      {(activeTab === 'watchlist' || activeTab === 'watched') && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="Filter by title..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredList.length} titles
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="empty-state-box">
              <Bookmark size={36} color="var(--text-muted)" />
              <h3 className="empty-state-title">
                {activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No watched titles in your diary yet'}
              </h3>
              <p className="empty-state-subtext">
                {activeTab === 'watchlist'
                  ? 'Browse trending films and charts to bookmark titles you want to watch.'
                  : 'Rate movies or mark them as watched to populate your cinema diary.'}
              </p>
              <Link to="/charts" className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Explore Cinema Charts
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.25rem'
            }}>
              {filteredList.map(item => {
                const isItemWatched = item.status === 'watched';
                const releaseYear = (item.releaseDate || '').slice(0, 4);
                const path = item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`;

                return (
                  <div key={`${item.mediaType}-${item.tmdbId}`} className="movie-compact-card">
                    <div className="movie-compact-poster-wrap">
                      <Link to={path}>
                        <img
                          src={getPoster(item.posterPath)}
                          alt={item.title}
                          className="movie-compact-poster"
                          loading="lazy"
                        />
                      </Link>
                      <button
                        onClick={() => toggleWatchlist(item)}
                        className="watchlist-bookmark-btn active"
                        title="Remove from list"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="movie-compact-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '700' }}>
                          <Star size={12} fill="var(--star-gold)" color="var(--star-gold)" />
                          <span>{item.voteAverage ? item.voteAverage.toFixed(1) : '8.0'}</span>
                        </div>
                        {releaseYear && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{releaseYear}</span>
                        )}
                      </div>

                      <Link to={path} className="movie-compact-title">
                        {item.title}
                      </Link>

                      {/* Watched Action */}
                      <button
                        onClick={() => markAsWatched(item)}
                        style={{
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: isItemWatched ? 'var(--success)' : 'var(--text-muted)'
                        }}
                      >
                        <CheckCircle2 size={13} color={isItemWatched ? 'var(--success)' : 'currentColor'} />
                        <span>{isItemWatched ? 'Watched' : 'Mark Watched'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Personal Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          {!isAuthenticated ? (
            <div className="empty-state-box">
              <BarChart2 size={36} color="var(--text-muted)" />
              <h3 className="empty-state-title">Sign in to view your cinema analytics</h3>
              <p className="empty-state-subtext">
                Personal statistics track your watch habits, favorite genres, and yearly activity over time.
              </p>
              <button onClick={() => openAuthModal('signup')} className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Sign In / Sign Up
              </button>
            </div>
          ) : (
            <div>
              {/* Stats KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    TOTAL FILMS WATCHED
                  </span>
                  <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stats?.totalWatched ?? watchedCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)' }}>
                    Recorded in your AfterFrame diary
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    AVERAGE PERSONAL RATING
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={32} fill="var(--star-gold)" color="var(--star-gold)" />
                    <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                      {stats?.averageRating ? `${stats.averageRating}` : 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 5.0</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Based on your half-star ratings
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    TITLES IN WATCHLIST
                  </span>
                  <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {planToWatchCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                    Planned for upcoming movie nights
                  </span>
                </div>
              </div>

              {/* Genre Distribution & Activity */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Most Watched Genres */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>
                    Most-Watched Genres
                  </h3>
                  {stats?.topGenres?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {stats.topGenres.map(g => (
                        <div key={g.genre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{g.genre}</span>
                          <span style={{
                            background: 'var(--accent-yellow-dim)',
                            color: 'var(--accent-yellow)',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            {g.count} titles
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Log more watched films to see your genre distribution.
                    </p>
                  )}
                </div>

                {/* Monthly Activity */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>
                    Activity by Month
                  </h3>
                  {stats?.monthlyActivity?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {stats.monthlyActivity.map(m => (
                        <div key={m.period} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{m.period}</span>
                          <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {m.count} films
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Activity will chart automatically as you record movies in your diary.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
