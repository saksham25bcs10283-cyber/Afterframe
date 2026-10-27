import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Plus, Check, Award, Film, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PersonDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, authFetch, openAuthModal } = useAuth();
  const [person, setPerson] = useState(null);
  const [upvotes, setUpvotes] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [userFollowing, setUserFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPerson();
  }, [id, isAuthenticated]);

  const fetchPerson = async () => {
    setLoading(true);
    try {
      const [personRes, voteRes] = await Promise.all([
        fetch(`/api/tmdb/person/${id}`),
        authFetch(`/api/community/people/trending`)
      ]);

      if (personRes.ok) {
        const pData = await personRes.json();
        setPerson(pData.data || pData);
      }

      if (voteRes.ok) {
        const vData = await voteRes.json();
        const found = (vData.people || []).find(p => String(p.id) === String(id));
        if (found) {
          setUpvotes(found.afterframe_votes || 0);
          setUserVoted(found.user_has_upvoted || false);
          setUserFollowing(found.user_is_following || false);
        }
      }
    } catch (err) {
      console.warn('Failed to load person details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const nextState = !userVoted;
    setUserVoted(nextState);
    setUpvotes(prev => Math.max(0, prev + (nextState ? 1 : -1)));

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
        setUserVoted(data.voted);
        setUpvotes(data.totalVotes);
      }
    } catch (err) {
      console.warn('Upvote error:', err);
      fetchPerson();
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const nextFollowing = !userFollowing;
    setUserFollowing(nextFollowing);

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
        setUserFollowing(data.following);
      }
    } catch (err) {
      console.warn('Follow error:', err);
      fetchPerson();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading celebrity profile...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Celebrity Not Found</h2>
        <Link to="/people" className="btn-primary" style={{ marginTop: '1rem' }}>Back to People</Link>
      </div>
    );
  }

  const credits = person.combined_credits?.cast || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '2.5rem auto', padding: '0 1.25rem' }}>
      {/* Profile Header */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        alignItems: 'flex-start',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        {/* Celebrity Portrait */}
        <div style={{
          width: '240px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '2px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
        }}>
          <img
            src={person.profile_path ? `https://image.tmdb.org/t/p/h632${person.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
            alt={person.name}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Info & Community Upvote */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'var(--accent-yellow)',
              color: '#000000',
              fontWeight: '900',
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              {person.known_for_department || 'Acting'}
            </span>
            {person.birthday && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} />
                Born {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.6rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {person.name}
          </h1>

          {person.place_of_birth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <MapPin size={15} />
              <span>{person.place_of_birth}</span>
            </div>
          )}

          {/* Action Buttons: Community Upvote & Personal Follow */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-yellow)', textTransform: 'uppercase' }}>
                AFTERFRAME COMMUNITY VOTES
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>
                {upvotes} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>member upvotes</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={handleUpvote}
                className={`btn-primary ${userVoted ? 'voted' : ''}`}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: userVoted ? 'var(--accent-yellow)' : 'var(--bg-surface-elevated)',
                  color: userVoted ? '#000000' : 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
                title="Contribute to AfterFrame community votes"
              >
                {userVoted ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
                <span>{userVoted ? 'Upvoted' : 'Upvote Celebrity'}</span>
              </button>

              <button
                onClick={handleFollow}
                className="btn-secondary"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: userFollowing ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                  color: userFollowing ? 'var(--accent-yellow)' : 'var(--text-primary)',
                  borderColor: userFollowing ? 'var(--accent-yellow)' : 'var(--border-subtle)'
                }}
                title={userFollowing ? 'Unfollow celebrity from your personal list' : 'Follow celebrity to personalize recommendations'}
              >
                {userFollowing ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
                <span>{userFollowing ? 'Following' : 'Follow Celebrity'}</span>
              </button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem' }}>Biography</h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {person.biography || `${person.name} is a distinguished talent recognized across international cinema and television.`}
            </p>
          </div>
        </div>
      </div>

      {/* Filmography Section */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div className="section-title-wrap">
          <div className="section-bar" />
          <h2 className="section-title">Notable Filmography</h2>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1.25rem'
      }}>
        {credits.slice(0, 12).map((item, idx) => {
          const title = item.title || item.name;
          const year = (item.release_date || item.first_air_date || '').slice(0, 4);

          return (
            <Link
              key={`${item.id}-${idx}`}
              to={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
              className="movie-compact-card"
            >
              <div className="movie-compact-poster-wrap">
                <img
                  src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80'}
                  alt={title}
                  className="movie-compact-poster"
                  loading="lazy"
                />
              </div>
              <div className="movie-compact-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '700' }}>
                  <Star size={12} fill="var(--star-gold)" color="var(--star-gold)" />
                  <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.5'}</span>
                </div>
                <div className="movie-compact-title">{title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.character ? `${item.character} • ` : ''}{year}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
