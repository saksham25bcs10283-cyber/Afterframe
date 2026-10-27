import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Check, Star, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PeoplePage() {
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPeople();
  }, [isAuthenticated]);

  const fetchPeople = async () => {
    try {
      const res = await authFetch('/api/community/people/trending');
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people || []);
      }
    } catch (err) {
      console.warn('Failed to fetch people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (person, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const currentlyVoted = person.user_has_upvoted;
    const delta = currentlyVoted ? -1 : 1;

    setPeople(prev => prev.map(p => {
      if (p.id === person.id) {
        return {
          ...p,
          user_has_upvoted: !currentlyVoted,
          afterframe_votes: Math.max(0, (p.afterframe_votes || 0) + delta)
        };
      }
      return p;
    }));

    try {
      const res = await authFetch('/api/community/people/upvote', {
        method: 'POST',
        body: JSON.stringify({
          personId: person.id,
          personName: person.name,
          profilePath: person.profile_path,
          knownForDepartment: person.known_for_department
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPeople(prev => prev.map(p => {
          if (p.id === person.id) {
            return {
              ...p,
              user_has_upvoted: data.voted,
              afterframe_votes: data.totalVotes
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.warn('Upvote error:', err);
      fetchPeople();
    }
  };

  const handleFollow = async (person, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const currentlyFollowing = person.user_is_following;
    setPeople(prev => prev.map(p => {
      if (p.id === person.id) {
        return { ...p, user_is_following: !currentlyFollowing };
      }
      return p;
    }));

    try {
      const res = await authFetch('/api/community/people/follow', {
        method: 'POST',
        body: JSON.stringify({
          personId: person.id,
          name: person.name,
          department: person.known_for_department || 'Acting',
          profilePath: person.profile_path || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPeople(prev => prev.map(p => {
          if (p.id === person.id) {
            return { ...p, user_is_following: data.following };
          }
          return p;
        }));
      }
    } catch (err) {
      console.warn('Follow error:', err);
      fetchPeople();
    }
  };

  const getProfileImg = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.25rem' }}>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-wrap">
          <div className="section-bar" style={{ height: '2rem' }} />
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
              Trending People & Community Upvotes
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real TMDB trending celebrities with separate persistent AfterFrame community upvotes
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '2rem', maxWidth: '380px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search celebrities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Grid of Circular Celebrity Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '2rem 1.5rem',
        textAlign: 'center'
      }}>
        {filteredPeople.map(person => {
          const isVoted = person.user_has_upvoted;
          const voteCount = person.afterframe_votes || 0;

          return (
            <div
              key={person.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem 1rem',
                transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-yellow)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <Link to={`/person/${person.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="person-avatar-wrapper" style={{ width: '120px', height: '120px', marginBottom: '0.75rem' }}>
                  <img
                    src={getProfileImg(person.profile_path)}
                    alt={person.name}
                    className="person-avatar-img"
                    loading="lazy"
                  />
                </div>

                <div className="person-rank-badge" style={{ marginBottom: '0.25rem' }}>
                  <span>Rank #{person.rank || 1}</span>
                  <span className="person-rank-delta">({person.rank_delta || '-'})</span>
                </div>

                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {person.name}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {person.known_for_department || 'Acting'}
                </div>
              </Link>

              {/* Independent Community Upvote & Personal Follow */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', marginTop: 'auto' }}>
                <button
                  onClick={(e) => handleUpvote(person, e)}
                  className={`person-upvote-btn ${isVoted ? 'voted' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', width: '100%', margin: 0 }}
                  title="Upvote in AfterFrame community"
                >
                  {isVoted ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                  <span>{isVoted ? 'Upvoted' : 'Upvote'}</span>
                  <span style={{ fontWeight: '800' }}>({voteCount})</span>
                </button>

                <button
                  onClick={(e) => handleFollow(person, e)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: person.user_is_following ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                    background: person.user_is_following ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                    color: person.user_is_following ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%'
                  }}
                  title={person.user_is_following ? 'Unfollow celebrity from your personal list' : 'Follow celebrity to personalize recommendations'}
                >
                  {person.user_is_following ? '✓ Following' : '+ Follow'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
