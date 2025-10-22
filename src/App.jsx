
import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { getTeamLeaderboard, getTeamSummary } from './functions.js';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [gameStartTs, setGameStartTs] = useState(() => {
    const saved = localStorage.getItem('gameStartTs');
    return saved ? Number(saved) : Date.now();
  });
  const [gameElapsed, setGameElapsed] = useState(0);

  const normalizeTeam = (row, index) => {
    const teamId = row?.team_id ?? row?.id ?? row?.teamId ?? index + 1;
    const name = row?.team_name ?? row?.name ?? `Team ${teamId}`;
    const cash = Number(row?.cash ?? row?.team_cash ?? row?.total_cash ?? 0) || 0;
    const totalValue = Number(row?.total ?? row?.total_cash ?? row?.net_worth ?? cash) || cash;
    const properties = Number(row?.properties ?? row?.property_count ?? row?.num_properties ?? 0) || 0;
    const position = Number(row?.position ?? row?.pos ?? 0) || (index + 1);
    return {
      teamId,
      name,
      rank: index + 1,
      properties,
      totalValue,
      cash,
      position,
      recentProperties: [],
    };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorText('');

      const { data, error } = await getTeamLeaderboard();
      if (error) throw error;
      const normalized = (data ?? []).map((row, idx) => normalizeTeam(row, idx));

      // Attempt to enrich with recent properties for all teams if team ids exist
      const teamsWithProps = await Promise.all(
        normalized.map(async (t) => {
          if (!t.teamId) return t;
          try {
            const { data: summary, error: summaryError } = await getTeamSummary(t.teamId);
            if (summaryError || !summary) return t;
            const recentProperties = (summary.owned_properties ?? [])
              .slice(-3)
              .map((p) => p.property_name);
            return { ...t, properties: summary.owned_properties?.length ?? t.properties, recentProperties };
          } catch (_) {
            return t;
          }
        })
      );

      const merged = teamsWithProps;
      setTeams(merged);
    } catch (err) {
      setErrorText(typeof err?.message === 'string' ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game timer tick
  useEffect(() => {
    localStorage.setItem('gameStartTs', String(gameStartTs));
    const tick = setInterval(() => {
      setGameElapsed(Math.max(0, Math.floor((Date.now() - gameStartTs) / 1000)));
    }, 1000);
    setGameElapsed(Math.max(0, Math.floor((Date.now() - gameStartTs) / 1000)));
    return () => clearInterval(tick);
  }, [gameStartTs]);

  const resetGameTimer = () => {
    const now = Date.now();
    setGameStartTs(now);
    localStorage.setItem('gameStartTs', String(now));
  };

  const formatHMS = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '↗️';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <img src="/finverse-logo1.png" alt="Finverse Logo" className="finverse-logo-small" />
          <div className="title-section">
            <h1 className="main-title">Finverse <span className="monopoly-board">MONOPOLY</span></h1>
            <p className="subtitle">Live Tournament Dashboard</p>
          </div>
        </div>
        <div className="header-right">
          <div className="time-display">
            <div className="time">{formatTime(currentTime)}</div>
            <div className="date">{formatDate(currentTime)}</div>
            <div className="game-timer">
              <span className="game-timer-label">Game Time:</span>
              <span className="game-timer-value">{formatHMS(gameElapsed)}</span>
              <button className="timer-reset-btn" onClick={resetGameTimer}>Reset</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Leaderboard */}
        <div className="leaderboard-section">
          <div className="section-header">
            <span className="section-icon">🏆</span>
            <h2>Leaderboard</h2>
          </div>
          <div className="leaderboard">
            {isLoading && teams.length === 0 && (
              <div className="team-card" style={{ textAlign: 'center' }}>Loading...</div>
            )}
            {errorText && (
              <div className="team-card" style={{ textAlign: 'center', color: '#fca5a5' }}>{errorText}</div>
            )}
            <div className="leaderboard-column">
              {teams.slice(0, 4).map((team) => (
                <div key={team.name} className={`team-card ${team.rank === 1 ? 'first-place' : ''}`}>
                  <div className="team-header">
                    <span className="rank-icon">{getRankIcon(team.rank)}</span>
                    <span className="team-name">{team.name}</span>
                  </div>
                <div className="team-stats">
                  <div className="properties-count">{team.properties} properties</div>
                  {!!(team.recentProperties && team.recentProperties.length) && (
                    <div className="property-tags">
                      {team.recentProperties.slice(-3).map((property, index) => (
                        <span key={index} className="property-tag">{property}</span>
                      ))}
                    </div>
                  )}
                    <div className="total-value">${team.totalValue.toLocaleString()}</div>
                    <div className="cash">Cash: ${team.cash.toLocaleString()}</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.max(5, Math.min(100, (team.cash || 0) / (team.totalValue || 1) * 100))}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="leaderboard-column">
              {teams.slice(4, 8).map((team) => (
                <div key={team.name} className={`team-card ${team.rank === 1 ? 'first-place' : ''}`}>
                  <div className="team-header">
                    <span className="rank-icon">{getRankIcon(team.rank)}</span>
                    <span className="team-name">{team.name}</span>
                  </div>
                  <div className="team-stats">
                    <div className="properties-count">{team.properties} properties</div>
                    {!!(team.recentProperties && team.recentProperties.length) && (
                      <div className="property-tags">
                        {team.recentProperties.slice(-3).map((property, index) => (
                          <span key={index} className="property-tag">{property}</span>
                        ))}
                      </div>
                    )}
                    <div className="total-value">${team.totalValue.toLocaleString()}</div>
                    <div className="cash">Cash: ${team.cash.toLocaleString()}</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.max(5, Math.min(100, (team.cash || 0) / (team.totalValue || 1) * 100))}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Right Corner removed */}
    </div>
  );
}

export default App;
