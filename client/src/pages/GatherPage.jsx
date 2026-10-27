import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Plus,
  Check,
  X,
  AlertCircle,
  Film,
  Sparkles,
  Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GatherPage() {
  const [searchParams] = useSearchParams();
  const preselectedMovieId = searchParams.get('movie');
  const preselectedTitle = searchParams.get('title') || '';

  const { isAuthenticated, authFetch, openAuthModal, user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(Boolean(preselectedMovieId));
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'my_events'

  // Create Event Form State
  const [formTitle, setFormTitle] = useState(preselectedTitle ? `${preselectedTitle} — Cinema Gathering` : '');
  const [formDescription, setFormDescription] = useState('Join us for a community viewing and discussion afterwards!');
  const [formEventType, setFormEventType] = useState('theatre_outing');
  const [formDateTime, setFormDateTime] = useState('');
  const [formVenue, setFormVenue] = useState('PVR INOX Palladium, Lower Parel');
  const [formCity, setFormCity] = useState('Mumbai, India');
  const [formMaxAttendees, setFormMaxAttendees] = useState(8);

  // Movie search in modal
  const [movieSearchQuery, setMovieSearchQuery] = useState(preselectedTitle || '');
  const [selectedMovie, setSelectedMovie] = useState(
    preselectedMovieId ? { tmdbId: Number(preselectedMovieId), title: preselectedTitle } : null
  );
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [isSearchingMovie, setIsSearchingMovie] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.warn('Failed to load gather events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSearch = async (val) => {
    setMovieSearchQuery(val);
    if (!val.trim()) {
      setMovieSearchResults([]);
      return;
    }
    setIsSearchingMovie(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(val.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setMovieSearchResults((data.results || []).filter(r => r.media_type !== 'person').slice(0, 5));
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearchingMovie(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!selectedMovie) {
      setFormError('Please search and select a movie for this gathering.');
      return;
    }
    if (!formDateTime) {
      setFormError('Please specify a date and showtime.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        movie: {
          tmdbId: selectedMovie.id || selectedMovie.tmdbId,
          title: selectedMovie.title || selectedMovie.name,
          posterPath: selectedMovie.poster_path || selectedMovie.posterPath || '',
          releaseDate: selectedMovie.release_date || selectedMovie.first_air_date || ''
        },
        eventType: formEventType,
        dateTime: new Date(formDateTime).toISOString(),
        venue: formVenue.trim(),
        city: formCity.trim(),
        maxAttendees: Number(formMaxAttendees)
      };

      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create event');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message || 'Error creating event. Ensure MongoDB is connected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (event) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await authFetch(`/api/events/${event._id}/join`, { method: 'POST' });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to join event');
      }
    } catch (err) {
      console.warn('RSVP join error:', err);
    }
  };

  const handleLeave = async (event) => {
    try {
      const res = await authFetch(`/api/events/${event._id}/leave`, { method: 'POST' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.warn('RSVP leave error:', err);
    }
  };

  const handleCancel = async (event) => {
    if (!window.confirm('Are you sure you want to cancel this cinema gathering?')) return;
    try {
      const res = await authFetch(`/api/events/${event._id}/cancel`, { method: 'PUT' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.warn('Cancel error:', err);
    }
  };

  const getPoster = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  const myEventsList = events.filter(e => e.isOrganizer || e.isAttending);
  const displayEvents = activeTab === 'my_events' ? myEventsList : events;

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.25rem' }}>
      {/* Title Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-wrap">
          <div className="section-bar" style={{ height: '2rem' }} />
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
              Gather — Cinema Outings & Watch Parties
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              The film doesn't end at the credits. Meet up with fellow cinephiles at local theatres or virtual watch parties.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
            } else {
              setShowCreateModal(true);
            }
          }}
          className="btn-primary"
          style={{ padding: '0.55rem 1.25rem' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Host a Gathering</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            padding: '0.55rem 1.15rem',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: activeTab === 'upcoming' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'upcoming' ? '3px solid var(--accent-yellow)' : '3px solid transparent'
          }}
        >
          All Upcoming Gatherings ({events.length})
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my_events')}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: '700',
              color: activeTab === 'my_events' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'my_events' ? '3px solid var(--accent-yellow)' : '3px solid transparent'
            }}
          >
            My Gatherings ({myEventsList.length})
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading gatherings...
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="empty-state-box">
          <Calendar size={36} color="var(--text-muted)" />
          <h3 className="empty-state-title">
            {activeTab === 'my_events' ? "You haven't joined or created any outings yet" : 'No upcoming gatherings currently scheduled'}
          </h3>
          <p className="empty-state-subtext">
            Be the first to host an outing for an upcoming release or weekend classic!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
          >
            Host First Gathering
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {displayEvents.map(event => {
            const isFull = event.isFull;
            const isAttending = event.isAttending;
            const isOrganizer = event.isOrganizer;
            const isCancelled = event.status === 'cancelled';
            const eventDate = new Date(event.dateTime);

            return (
              <div
                key={event._id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isCancelled ? 0.6 : 1
                }}
              >
                {/* Event Header with Movie Snippet */}
                <div style={{
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <img
                    src={getPoster(event.movie?.posterPath)}
                    alt={event.movie?.title}
                    style={{
                      width: '60px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'inline-block',
                      background: event.eventType === 'theatre_outing' ? 'var(--accent-yellow-dim)' : 'var(--accent-blue-dim)',
                      color: event.eventType === 'theatre_outing' ? 'var(--accent-yellow)' : 'var(--accent-blue)',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem'
                    }}>
                      {event.eventType === 'theatre_outing' ? 'Theatre Outing' : 'Virtual Watch Party'}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {event.title}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-yellow)', fontWeight: '600' }}>
                      Film: {event.movie?.title}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <Calendar size={15} color="var(--accent-yellow)" />
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={15} color="var(--accent-blue)" />
                    <span>{event.venue} ({event.city})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Users size={15} />
                    <span>
                      {event.attendeesCount} / {event.maxAttendees} attendees {isFull && '(FULL)'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {event.description}
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Hosted by <strong>{event.organizerName}</strong>
                    </div>

                    {/* Action buttons */}
                    {isCancelled ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '700' }}>Cancelled</span>
                    ) : isOrganizer ? (
                      <button
                        onClick={() => handleCancel(event)}
                        style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: '700' }}
                      >
                        Cancel Outing
                      </button>
                    ) : isAttending ? (
                      <button
                        onClick={() => handleLeave(event)}
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--danger)' }}
                      >
                        Leave Outing
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(event)}
                        disabled={isFull}
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', opacity: isFull ? 0.5 : 1 }}
                      >
                        {isFull ? 'At Capacity' : 'RSVP Join'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Event Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div className="section-title-wrap">
                <div className="section-bar" style={{ height: '1.4rem' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Host a Cinema Outing</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
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
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Movie Search & Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Select Film
                </label>
                {selectedMovie ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--accent-yellow)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-yellow)' }}>
                      🎬 {selectedMovie.title || selectedMovie.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMovie(null)}
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search title to watch together..."
                      value={movieSearchQuery}
                      onChange={(e) => handleMovieSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-elevated)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    {movieSearchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        overflow: 'hidden'
                      }}>
                        {movieSearchResults.map(m => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMovie(m);
                              setFormTitle(`${m.title || m.name} — Cinema Outing`);
                              setMovieSearchResults([]);
                            }}
                            style={{
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <strong>{m.title || m.name}</strong> ({(m.release_date || m.first_air_date || '').slice(0, 4)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Event Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. IMAX Friday Night Screening & Discussion"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Event Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Type
                  </label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="theatre_outing">Theatre Outing (Physical)</option>
                    <option value="watch_party">Virtual Watch Party</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={formMaxAttendees}
                    onChange={(e) => setFormMaxAttendees(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Date & Showtime
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formDateTime}
                  onChange={(e) => setFormDateTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Venue & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Cinema Venue / Stream Platform
                  </label>
                  <input
                    type="text"
                    required
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. PVR INOX Palladium Screen 3"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Mumbai, India"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Meeting point outside ticket counter, post-movie coffee..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Creating Outing...' : 'Publish Gathering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
