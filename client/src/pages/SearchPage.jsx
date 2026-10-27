import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, Bookmark, Plus, Check, Users } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [inputVal, setInputVal] = useState(query);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'movie' | 'tv' | 'person'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputVal(query);
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  const filteredResults = results.filter(item => {
    if (activeTab === 'all') return true;
    return item.media_type === activeTab;
  });

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.25rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '640px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search titles, series, celebrities..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem' }}>
            Search
          </button>
        </form>
      </div>

      {query && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
            Search results for <span style={{ color: 'var(--accent-yellow)' }}>"{query}"</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Found {filteredResults.length} matches
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem'
      }}>
        {[
          { key: 'all', label: 'All Results' },
          { key: 'movie', label: 'Feature Films' },
          { key: 'tv', label: 'TV Shows' },
          { key: 'person', label: 'People' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: '700',
              background: activeTab === tab.key ? 'var(--accent-yellow)' : 'transparent',
              color: activeTab === tab.key ? '#000000' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Searching catalogue...
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="empty-state-box">
          <Search size={32} color="var(--text-muted)" />
          <h3 className="empty-state-title">No matching titles found</h3>
          <p className="empty-state-subtext">
            Try searching for another movie, series or actor, or check your spelling.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredResults.map(item => {
            const isPerson = item.media_type === 'person';
            const title = item.title || item.name;
            const year = (item.release_date || item.first_air_date || '').slice(0, 4);
            const inWatchlist = !isPerson && isInWatchlist(item.id, item.media_type || 'movie');
            const linkPath = isPerson ? `/person/${item.id}` : (item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`);

            return (
              <div key={`${item.media_type}-${item.id}`} className="movie-compact-card">
                <div className="movie-compact-poster-wrap">
                  <Link to={linkPath}>
                    <img
                      src={getPoster(item.poster_path || item.profile_path)}
                      alt={title}
                      className="movie-compact-poster"
                      loading="lazy"
                    />
                  </Link>
                  {!isPerson && (
                    <button
                      onClick={() => toggleWatchlist(item)}
                      className={`watchlist-bookmark-btn ${inWatchlist ? 'active' : ''}`}
                      title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <Check size={16} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>

                <div className="movie-compact-body">
                  {!isPerson && item.vote_average > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '700' }}>
                      <Star size={12} fill="var(--star-gold)" color="var(--star-gold)" />
                      <span>{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  <Link to={linkPath} className="movie-compact-title">
                    {title}
                  </Link>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isPerson ? 'Celebrity' : `${item.media_type === 'tv' ? 'TV Series' : 'Movie'} ${year ? `• ${year}` : ''}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
