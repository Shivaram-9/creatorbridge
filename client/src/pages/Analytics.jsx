import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profile, posts, campaigns] = await Promise.all([
          api.analytics.getProfile(),
          api.analytics.getPosts(),
          api.analytics.getCampaigns()
        ]);
        setProfileData(profile);
        setPostsData(posts);
        setCampaignsData(campaigns);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!profileData?.growth) return [];
    return profileData.growth.map(s => ({
      name: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      followers: s.followers,
      views: s.profileViews,
      engagement: s.engagement
    }));
  }, [profileData]);

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="analytics-dashboard">
      <header className="dashboard-header">
        <h1>Professional Insights</h1>
        <p>Real-time performance tracking and audience metrics</p>
      </header>

      {/* Overview Cards */}
      <div className="stats-grid">
        <StatCard title="Total Reach" value={profileData?.totalViews || 0} change="+12%" icon="👁️" />
        <StatCard title="Engagement" value={`${profileData?.engagementRate || 0}%`} change="+2.4%" icon="📈" />
        <StatCard title="Followers" value={profileData?.followers || 0} change="+54" icon="👥" />
        <StatCard title="Profile Views" value={profileData?.profileViews || 0} change="+18%" icon="👤" />
      </div>

      <div className="charts-section">
        {/* Growth Chart */}
        <div className="chart-container">
          <h3>Audience Growth</h3>
          <div className="h-400">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="followers" stroke="#000" fillOpacity={1} fill="url(#colorFollow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="chart-container">
          <h3>Engagement Over Time</h3>
          <div className="h-400">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="views" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-row">
        {/* Top Posts Section */}
        <div className="top-posts-card">
          <h3>Top Performing Content</h3>
          <div className="post-rank-list">
            {postsData?.topPosts?.map((post, i) => (
              <div key={post._id} className="post-rank-item">
                <span className="rank-num">#{i+1}</span>
                <img src={post.mediaUrl || post.media || "https://via.placeholder.com/50"} alt="" />
                <div className="post-rank-info">
                  <p className="post-rank-text">{post.content?.slice(0, 30)}...</p>
                  <span className="post-rank-stats">{post.views} views • {post.likes?.length} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Analytics */}
        <div className="campaign-insights-card">
          <h3>Marketplace Insights</h3>
          <div className="insight-metrics">
            <div className="metric-row">
              <span>{user?.role === "brand" ? "Total Applications" : "Collabs Completed"}</span>
              <span className="metric-val">{campaignsData?.applications || campaignsData?.completed || 0}</span>
            </div>
            <div className="metric-row">
              <span>Active Collaborations</span>
              <span className="metric-val">{campaignsData?.accepted || campaignsData?.active || 0}</span>
            </div>
            <div className="metric-row">
              <span>Marketplace Rank</span>
              <span className="metric-val">Top 5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h4>{title}</h4>
        <div className="stat-value-row">
          <span className="stat-value">{value}</span>
          <span className="stat-change positive">{change}</span>
        </div>
      </div>
    </div>
  );
}
