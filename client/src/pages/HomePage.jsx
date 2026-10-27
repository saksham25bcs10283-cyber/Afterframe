import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import GuestWelcomeHero from '../components/GuestWelcomeHero';
import TrendingPeopleCarousel from '../components/TrendingPeopleCarousel';
import WhatToWatchSection from '../components/WhatToWatchSection';
import RegionalDiscoverySection from '../components/RegionalDiscoverySection';
import PopularInterestsSection from '../components/PopularInterestsSection';
import ExploreStreamingSection from '../components/ExploreStreamingSection';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import { useRegion } from '../context/RegionContext';

export default function HomePage() {
  const { region } = useRegion();
  const [top10, setTop10] = useState([]);
  const [trending, setTrending] = useState([]);
  const [regionalMovies, setRegionalMovies] = useState([]);
  const [regionalLabel, setRegionalLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, [region]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [top10Res, trendingRes, regionalRes] = await Promise.all([
        fetch('/api/tmdb/top-10'),
        fetch('/api/tmdb/trending?mediaType=movie&timeWindow=week'),
        fetch(`/api/tmdb/regional-discovery?region=${region}`)
      ]);

      if (top10Res.ok) {
        const top10Data = await top10Res.json();
        setTop10(top10Data.results || []);
      }
      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrending(trendingData.results || []);
      }
      if (regionalRes.ok) {
        const regionalData = await regionalRes.json();
        setRegionalMovies(regionalData.results || []);
        setRegionalLabel(regionalData.label || '');
      }
    } catch (err) {
      console.warn('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const featured = top10[0] || trending[0];
  const rail = top10.slice(1, 5).length ? top10.slice(1, 5) : trending.slice(1, 5);

  return (
    <main style={{ paddingBottom: '3rem' }}>
      {/* 0. First-Time Guest Value Proposition & Actions */}
      <GuestWelcomeHero />

      {/* 1. Cinematic Hero Banner */}
      {featured && <HeroBanner featuredMovie={featured} railMovies={rail} />}

      {/* 2. Trending People with Community Upvotes (Matches Screenshot 1) */}
      <TrendingPeopleCarousel />

      {/* 3. What to Watch & Top 10 Ranked Cards (Matches Screenshot 1 & 2) */}
      <WhatToWatchSection top10Movies={top10.length ? top10 : trending} />

      {/* 4. Regional Discovery: India, US & UK Origin Cinema */}
      <RegionalDiscoverySection movies={regionalMovies} label={regionalLabel} loading={loading} />

      {/* 5. Popular Interests Wide Cards (Matches Screenshot 3) */}
      <PopularInterestsSection />

      {/* 6. Explore What's Streaming with Provider Tabs (Matches Screenshot 3 & 4) */}
      <ExploreStreamingSection movies={regionalMovies.length ? regionalMovies : trending} />

      {/* 7. Personalized Recommendations / Playful Opening Credits Empty State */}
      <PersonalizedRecommendations />
    </main>
  );
}
