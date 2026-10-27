import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Check, ChevronRight as ChevronIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TrendingPeopleCarousel() {
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

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
      console.warn('Failed to load trending people:', err);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleUpvote = async (person, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    // Optimistic toggle
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
        // Sync final count from database
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
      // Revert if error
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
    // Optimistic toggle
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

  return (
    <section style={{ maxWidth: '1380px', margin: '0 auto 3rem auto', padding: '0 1.25rem' }}>
      {/* Signature IMDb Yellow Bar Section Header */}
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-bar" />
          <Link to="/people" className="section-title">
            <span>Trending people</span>
            <ChevronIcon className="section-chevron" />
          </Link>
        </div>
      </div>

      {/* Sublabel matching screenshot */}
      <div style={{ display: 'flex', gap: '8rem', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
        <span className="section-sublabel">TOP RISING</span>
        <span className="section-sublabel">BY RANKING</span>
      </div>

      <div className="carousel-container">
        <button
          onClick={() => scroll('left')}
          className="carousel-nav-btn prev"
          title="Scroll left"
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>

        <div ref={trackRef} className="carousel-track">
          {people.map((person) => {
            const isVoted = person.user_has_upvoted;
            const voteCount = person.afterframe_votes || 0;

            return (
              <div key={person.id} className="person-circle-card">
                <Link to={`/person/${person.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Circular Portrait with + Badge */}
                  <div className="person-avatar-wrapper">
                    <img
                      src={getProfileImg(person.profile_path)}
                      alt={person.name}
                      className="person-avatar-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';
                      }}
                    />
                    <button
                      onClick={(e) => handleUpvote(person, e)}
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '2px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isVoted ? 'var(--accent-yellow)' : 'rgba(0, 0, 0, 0.75)',
                        border: '1.5px solid #ffffff',
                        color: isVoted ? '#000000' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 120ms'
                      }}
                      title={isVoted ? 'Remove community upvote' : 'Upvote on AfterFrame'}
                    >
                      {isVoted ? <Check size={14} strokeWidth={3} /> : <Plus size={15} strokeWidth={2.5} />}
                    </button>
                  </div>

                  {/* Rank & Delta (e.g. "1 (▲ 1,459)") */}
                  <div className="person-rank-badge">
                    <span>{person.rank || 1}</span>
                    <span className="person-rank-delta">({person.rank_delta || '-'})</span>
                  </div>

                  {/* Name */}
                  <div className="person-name" title={person.name}>
                    {person.name}
                  </div>
                </Link>

                {/* Action Buttons: Independent Community Upvote & Personal Follow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', marginTop: '0.4rem' }}>
                  <button
                    onClick={(e) => handleUpvote(person, e)}
                    className={`person-upvote-btn ${isVoted ? 'voted' : ''}`}
                    title="Contribute to AfterFrame community votes"
                    style={{ margin: 0, width: '100%' }}
                  >
                    <span>{isVoted ? 'Upvoted' : 'Upvote'}</span>
                    <span style={{ fontWeight: '800' }}>{voteCount}</span>
                  </button>

                  <button
                    onClick={(e) => handleFollow(person, e)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: person.user_is_following ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                      background: person.user_is_following ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                      color: person.user_is_following ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      width: '100%'
                    }}
                    title={person.user_is_following ? 'Unfollow celebrity from your taste profile' : 'Follow celebrity to personalize recommendations'}
                  >
                    {person.user_is_following ? '✓ Following' : '+ Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="carousel-nav-btn next"
          title="Scroll right"
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}
