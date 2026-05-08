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
    <div className="analytics-dashboard container slide-in">
      <header className="dashboard-header">
        <div className="header-badge">AI ANALYTICS ENABLED</div>
        <h1>Performance Intelligence</h1>
        <p>Real-time tracking powered by CreatorBridge AI Discovery.</p>
      </header>

      {/* Overview Cards */}
      <div className="stats-grid">
        <StatCard title="Total Reach" value={profileData?.totalViews || 0} change="+12%" icon="👁️" />
        <StatCard title="Engagement" value={`${profileData?.engagementRate || 0}%`} change="+2.4%" icon="📈" />
        <StatCard title="Followers" value={profileData?.followers || 0} change="+54" icon="👥" />
        <StatCard title="Profile Views" value={profileData?.profileViews || 0} change="+18%" icon="👤" />
      </div>

      {/* AI Insight Cards (Prompt-7) */}
      <section className="ai-insights-section">
        <h2 className="section-title">AI Engagement Insights</h2>
        <div className="insights-grid">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon">
                  {insight.type === 'time' ? '⏰' : insight.type === 'category' ? '🏷️' : '🚀'}
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
                      <img src={resolveMedia(post)} alt="" onError={(e) => e.target.src = "https://via.placeholder.com/150?text=Post"} />
                    ) : (
                      <div className="media-placeholder">📄</div>
                    )}
                  </div>
                  <div className="post-rank-info">
                    <div className="creator-mini">
                      <Avatar user={post.user} size="xs" />
                      <span className="creator-name">@{post.user?.username || user.username}</span>
                    </div>
                    <p className="post-rank-text">{post.content?.slice(0, 40) || "No caption"}...</p>
                    <div className="post-rank-footer">
                      <span className="stat">👁️ {post.views || 0} views</span>
                      <span className="stat">❤️ {post.likes?.length || 0} likes</span>
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
            <p>💡 Tip: Posting 3+ times a week increases engagement by 24%.</p>
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
