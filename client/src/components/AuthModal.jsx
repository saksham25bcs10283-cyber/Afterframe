import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Search, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GENRE_OPTIONS = [
  'Action', 'Thriller', 'Drama', 'Comedy', 'Sci-Fi', 'Horror',
  'Romance', 'Mystery', 'Animation', 'Crime', 'Adventure', 'Fantasy'
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' }
];

export default function AuthModal() {
  const { authModalState, closeAuthModal, login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(authModalState.mode !== 'signup');
  const [signupStep, setSignupStep] = useState(0); // 0: Credentials, 1: Genres, 2: Languages, 3: Viewing, 4: Titles/People

  // Credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Preference Wizard State
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [viewingEra, setViewingEra] = useState('any'); // 'any' | 'recent' | 'classic'
  const [viewingLength, setViewingLength] = useState('any'); // 'any' | 'short' | 'long'
  const [viewingMood, setViewingMood] = useState('any'); // 'any' | 'lighthearted' | 'intense'
  const [favoriteTitles, setFavoriteTitles] = useState([]);
  const [favoritePeople, setFavoritePeople] = useState([]);

  // Search autocomplete in Step 4
  const [talentSearchQuery, setTalentSearchQuery] = useState('');
  const [talentSearchResults, setTalentSearchResults] = useState([]);
  const [isSearchingTalent, setIsSearchingTalent] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode if changed from props
  useEffect(() => {
    setIsLoginMode(authModalState.mode !== 'signup');
    setSignupStep(0);
    setError('');
    setSuccessMsg('');
  }, [authModalState.mode, authModalState.isOpen]);

  // Debounce TMDB search in Step 4
  useEffect(() => {
    if (!talentSearchQuery.trim()) {
      setTalentSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingTalent(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(talentSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to top 5 relevant items
          setTalentSearchResults((data.results || []).slice(0, 5));
        }
      } catch (err) {
        console.warn('Talent search error:', err);
      } finally {
        setIsSearchingTalent(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [talentSearchQuery]);

  if (!authModalState.isOpen) return null;

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLanguage = (langLabel) => {
    setSelectedLanguages((prev) =>
      prev.includes(langLabel) ? prev.filter((l) => l !== langLabel) : [...prev, langLabel]
    );
  };

  const addFavoriteItem = (item) => {
    if (item.media_type === 'person') {
      if (!favoritePeople.some((p) => p.id === item.id)) {
        setFavoritePeople((prev) => [
          ...prev,
          {
            id: item.id,
            name: item.name,
            department: item.known_for_department || 'Acting',
            profilePath: item.profile_path || ''
          }
        ]);
      }
    } else {
      if (!favoriteTitles.some((t) => t.id === item.id)) {
        setFavoriteTitles((prev) => [
          ...prev,
          {
            id: item.id,
            title: item.title || item.name,
            mediaType: item.media_type || 'movie',
            posterPath: item.poster_path || ''
          }
        ]);
      }
    }
    setTalentSearchQuery('');
    setTalentSearchResults([]);
  };

  const removeFavoriteTitle = (id) => {
    setFavoriteTitles((prev) => prev.filter((t) => t.id !== id));
  };

  const removeFavoritePerson = (id) => {
    setFavoritePeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleNextFromCredentials = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setSignupStep(1);
  };

  const handleFinalSignupSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const preferences = {
      genres: selectedGenres,
      languages: selectedLanguages,
      viewingStyles: {
        era: viewingEra,
        length: viewingLength,
        mood: viewingMood
      },
      favoriteTitles,
      favoritePeople
    };

    try {
      const response = await register(name, email, password, preferences);
      // Explicit login required: Do not auto login. Redirect to sign in.
      setIsLoginMode(true);
      setSignupStep(0);
      setPassword(''); // Clear password input
      setSuccessMsg(response?.message || 'Account created successfully! Please sign in with your credentials to start your personalized experience.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isLoginMode ? '440px' : (signupStep === 0 ? '460px' : '540px'),
          padding: '1.75rem',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'var(--accent-yellow)',
              color: '#000000',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '900',
              fontSize: '0.85rem'
            }}>
              AF
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                {isLoginMode
                  ? 'Welcome back to AfterFrame'
                  : (signupStep === 0 ? 'Create your AfterFrame account' : 'Customize Your Cinema Taste')}
              </h2>
              {!isLoginMode && signupStep > 0 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-yellow)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Taste Profile • Step {signupStep} of 4
                </span>
              )}
            </div>
          </div>
          <button onClick={closeAuthModal} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher (only in Step 0 or login) */}
        {(isLoginMode || signupStep === 0) && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.2rem',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setIsLoginMode(true); setError(''); setSuccessMsg(''); setSignupStep(0); }}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: isLoginMode ? '#000000' : 'var(--text-secondary)',
                background: isLoginMode ? 'var(--accent-yellow)' : 'transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginMode(false); setError(''); setSuccessMsg(''); setSignupStep(0); }}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: !isLoginMode ? '#000000' : 'var(--text-secondary)',
                background: !isLoginMode ? 'var(--accent-yellow)' : 'transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success Alert (after account creation redirect) */}
        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            marginBottom: '1.25rem',
            color: '#4ade80',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.75rem',
            marginBottom: '1rem',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* --- SIGN IN FORM --- */}
        {isLoginMode ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@cinema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In to AfterFrame'}
            </button>
          </form>
        ) : (
          /* --- SIGNUP FLOW WITH 4-STEP ONBOARDING WIZARD --- */
          <div>
            {/* Step Progress Bar */}
            {signupStep > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <span>Genres</span>
                  <span>Languages</span>
                  <span>Style</span>
                  <span>Favorites</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(signupStep / 4) * 100}%`,
                      background: 'var(--accent-yellow)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 0: Basic Account Information */}
            {signupStep === 0 && (
              <form onSubmit={handleNextFromCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanley Kubrick"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@cinema.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Password (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-elevated)',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>Continue to Taste Preferences</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* Step 1: Genres */}
            {signupStep === 1 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Select the film & TV genres that resonate most with you. We use this to curate your homepage and Taste Match.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          border: isSelected ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                          color: isSelected ? 'var(--accent-yellow)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{genre}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSignupStep(0)}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Languages */}
            {signupStep === 2 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Select the cinema languages you enjoy watching. Helps personalize regional discovery and streaming picks.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.label);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleLanguage(lang.label)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          border: isSelected ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                          color: isSelected ? 'var(--accent-yellow)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{lang.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSignupStep(3)}
                      style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep(3)}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Viewing Preferences */}
            {signupStep === 3 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.15rem' }}>
                  Tell us about your viewing habits so we can fine-tune recommendations to your mood and schedule.
                </p>

                {/* Era Preference */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Release Era
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {[
                      { id: 'any', label: 'Any Era' },
                      { id: 'recent', label: 'Modern (2000+)' },
                      { id: 'classic', label: 'Classic Cinema' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setViewingEra(opt.id)}
                        style={{
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          border: viewingEra === opt.id ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                          background: viewingEra === opt.id ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                          color: viewingEra === opt.id ? 'var(--accent-yellow)' : 'var(--text-secondary)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length Preference */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Runtime Length
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {[
                      { id: 'any', label: 'Any Duration' },
                      { id: 'short', label: 'Crisp (≤ 100m)' },
                      { id: 'long', label: 'Epic (≥ 135m)' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setViewingLength(opt.id)}
                        style={{
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          border: viewingLength === opt.id ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                          background: viewingLength === opt.id ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                          color: viewingLength === opt.id ? 'var(--accent-yellow)' : 'var(--text-secondary)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood Preference */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Story Tone
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {[
                      { id: 'any', label: 'Balanced' },
                      { id: 'lighthearted', label: 'Lighthearted' },
                      { id: 'intense', label: 'Intense & Dark' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setViewingMood(opt.id)}
                        style={{
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          border: viewingMood === opt.id ? '1px solid var(--accent-yellow)' : '1px solid var(--border-subtle)',
                          background: viewingMood === opt.id ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-surface-elevated)',
                          color: viewingMood === opt.id ? 'var(--accent-yellow)' : 'var(--text-secondary)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSignupStep(4)}
                      style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep(4)}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Favorite Titles & Talent via real TMDB search */}
            {signupStep === 4 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Search and pin favorite movies, series, directors, or actors to jumpstart your Taste Match.
                </p>

                {/* TMDB Search Bar */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search Nolan, Inception, Villeneuve, Margot Robbie..."
                      value={talentSearchQuery}
                      onChange={(e) => setTalentSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 2.2rem 0.55rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-elevated)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <Search size={16} style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)' }} />
                  </div>

                  {/* Search Autocomplete Dropdown */}
                  {talentSearchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                      zIndex: 20,
                      marginTop: '4px',
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}>
                      {talentSearchResults.map((item) => (
                        <div
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => addFavoriteItem(item)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-elevated)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '2px',
                              background: item.media_type === 'person' ? 'rgba(245, 197, 24, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color: item.media_type === 'person' ? 'var(--accent-yellow)' : 'var(--text-secondary)'
                            }}>
                              {item.media_type}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.name || item.title}
                            </span>
                          </div>
                          <Plus size={15} color="var(--accent-yellow)" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Items */}
                <div style={{ minHeight: '80px', marginBottom: '1.25rem' }}>
                  {(favoriteTitles.length > 0 || favoritePeople.length > 0) ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {favoriteTitles.map((t) => (
                        <span
                          key={t.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                            color: 'var(--text-primary)'
                          }}
                        >
                          🎬 {t.title}
                          <button
                            type="button"
                            onClick={() => removeFavoriteTitle(t.id)}
                            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {favoritePeople.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(245, 197, 24, 0.12)',
                            border: '1px solid rgba(245, 197, 24, 0.3)',
                            fontSize: '0.78rem',
                            color: 'var(--accent-yellow)'
                          }}
                        >
                          👤 {p.name}
                          <button
                            type="button"
                            onClick={() => removeFavoritePerson(p.id)}
                            style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                      No items pinned yet. You can also skip this and add favorites anytime from movie pages or people profiles.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSignupStep(3)}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSignupSubmit}
                      style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                    >
                      Skip & Submit
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSignupSubmit}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.15rem', opacity: isSubmitting ? 0.7 : 1 }}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Complete Account Creation'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to AfterFrame's community guidelines.
        </div>
      </div>
    </div>
  );
}
