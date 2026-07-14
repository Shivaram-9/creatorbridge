import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import "./Analytics.css";

export default function Analytics() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [postsData, setPostsData] = useState(null);
  const [campaignsData, setCampaignsData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profile, posts, campaigns, insights] = await Promise.all([
          api.analytics.getProfile(),
          api.analytics.getPosts(),
          api.analytics.getCampaigns(),
          api.analytics.getInsights()
        ]);
        setProfileData(profile);
        setPostsData(posts);
        setCampaignsData(campaigns);
        setAiInsights(insights.insights || []);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!profileData?.growth?.length) return [];
    return profileData.growth.map(s => ({
      name: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      followers: s.followers,
      views: s.profileViews,
      engagement: s.engagement
    }));
  }, [profileData]);

  const resolveMedia = (post) => {
    const media = post.media?.[0] || post.image || post.mediaUrl;
    if (!media) return null;
    if (media.startsWith('http')) return media;
    return `${api.getResolvedApiOrigin()}${media}`;
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="analytics-dashboard slide-up-fade">
      <header className="page-header-block">
        <h1 className="page-title-main">Performance Intelligence</h1>
        <p className="page-subtitle-main">Real-time tracking powered by Pactogram AI Discovery.</p>
      </header>


      {/* Overview Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Reach" 
          value={profileData?.totalViews || 0} 
          change="+12%" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
          } 
        />
        <StatCard 
          title="Engagement" 
          value={`${profileData?.engagementRate || 0}%`} 
          change="+2.4%" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          } 
        />
        <StatCard 
          title="Followers" 
          value={profileData?.followers || 0} 
          change="+54" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          } 
        />
        <StatCard 
          title="Profile Views" 
          value={profileData?.profileViews || 0} 
          change="+18%" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          } 
        />
      </div>

      {/* AI Insight Cards (Prompt-7) */}
      <section className="ai-insights-section">
        <h2 className="section-title">AI Engagement Insights</h2>
        <div className="insights-grid">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  {insight.type === 'time' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) : insight.type === 'category' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 3.4-2 3.4s2.14-.5 3.4-2c1.26-1.5 2.1-3.2 2.1-3.2s-1.8-.84-3.5-2.1c0 0-1.5.9-2.1 2.1z"/><path d="M12 12c-2.3 2.3-3 5.7-3 5.7s3.4-.7 5.7-3c1.26-1.26 2-3 2-3s-1.8-.8-3.5-2c0 0-1.26.74-2 2z"/><path d="M21 3s-6.3 3-8.3 5c-1.8 1.8-2.7 3.6-2.7 3.6s2.7.9 4.5-.9c2-2 5-8.3 5-8.3z"/><path d="M16 8l3-3"/></svg>
                  )}
                </span>
                <span className="insight-type-label">{insight.type.toUpperCase()}</span>
              </div>
              <h3>{insight.title}</h3>
              <div className="insight-value">{insight.value}</div>
              <p>{insight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="charts-section">
        {/* Growth Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Audience Growth</h3>
            <span className="chart-period">Last 30 Days</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFollow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Engagement Over Time</h3>
            <span className="chart-period">Interactions vs Views</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="engagement" name="Engagement" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="views" name="Profile Views" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-row">
        {/* Top Posts Section */}
        <div className="top-posts-card">
          <div className="card-header">
            <h3>Top Performing Content</h3>
            <span className="badge">POSTS</span>
          </div>
          <div className="post-rank-list">
            {postsData?.topPosts?.length > 0 ? (
              postsData.topPosts.map((post, i) => (
                <div key={post._id} className="post-rank-item">
                  <span className="rank-num">#{i+1}</span>
                  <div className="post-rank-media">
                    {resolveMedia(post) ? (
                      <img src={resolveMedia(post)} alt="" onError={(e) => { e.target.style.display='none'; }} />
                    ) : (
                      <div className="media-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="post-rank-info">
                    <div className="creator-mini">
                      <Avatar user={post.user} size="xs" />
                      <span className="creator-name">@{post.user?.username || user.username}</span>
                    </div>
                    <p className="post-rank-text">{post.content?.slice(0, 40) || "No caption"}...</p>
                    <div className="post-rank-footer">
                      <span className="stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                        {post.views || 0} views
                      </span>
                      <span className="stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle', marginLeft: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ fill: '#ef4444' }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        {post.likes?.length || 0} likes
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-insights">No post data available yet.</div>
            )}
          </div>
        </div>

        {/* Campaign Analytics */}
        <div className="campaign-insights-card">
          <div className="card-header">
            <h3>Marketplace Insights</h3>
            <span className="badge">COLLABS</span>
          </div>
          <div className="insight-metrics">
            <div className="metric-row">
              <div className="metric-label">
                <span className="dot" style={{backgroundColor: '#3b82f6'}}></span>
                {user?.role === "brand" ? "Total Applications" : "Collabs Completed"}
              </div>
              <span className="metric-val">{campaignsData?.applications || campaignsData?.completed || 0}</span>
            </div>
            <div className="metric-row">
              <div className="metric-label">
                <span className="dot" style={{backgroundColor: '#10b981'}}></span>
                Active Collaborations
              </div>
              <span className="metric-val">{campaignsData?.accepted || campaignsData?.active || 0}</span>
            </div>
            <div className="metric-row">
              <div className="metric-label">
                <span className="dot" style={{backgroundColor: '#f59e0b'}}></span>
                Marketplace Rank
              </div>
              <span className="metric-val">Top 5%</span>
            </div>
          </div>
          <div className="market-tips">
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
              Tip: Posting 3+ times a week increases engagement by 24%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon-wrap">{icon}</div>
        <span className="stat-change positive">{change}</span>
      </div>
      <div className="stat-body">
        <h4>{title}</h4>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
