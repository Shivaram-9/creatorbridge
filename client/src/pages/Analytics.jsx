import { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { api } from "../services/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { BASE_URL } from "../config/api.js";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.analytics.getProfile();
        if (!res?.error) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner centered />;
  if (!data) return <div className="container">Failed to load analytics.</div>;

  const { overview, topPosts, charts } = data;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '0.5rem' }}>Analytics Dashboard</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Track your growth, engagement, and content performance</p>
      </header>

      {/* Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <MetricCard title="Followers" value={overview?.followers || 0} color="#1d9bf0" trend="+12%" />
        <MetricCard title="Total Posts" value={overview?.posts || 0} color="#10b981" />
        <MetricCard title="Engagement" value={overview?.engagementRate || "0%"} color="#f59e0b" trend="Premium" />
        <MetricCard title="Profile Views" value={overview?.profileViews || 0} color="#8b5cf6" />
        <MetricCard title="Post Reach" value={overview?.postViews || 0} color="#ec4899" />
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="chart-container" style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '24px', 
          border: '1px solid #eee',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Follower Growth</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={charts?.growth || []}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d9bf0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1d9bf0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="followers" stroke="#1d9bf0" strokeWidth={3} fillOpacity={1} fill="url(#colorFollowers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container" style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '24px', 
          border: '1px solid #eee',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Daily Engagement</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={charts?.growth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="engagement" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <section>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Top Performing Content</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {(topPosts || []).map(post => (
            <div key={post._id} style={{ 
              background: 'white', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              border: '1px solid #eee',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {post.image ? (
                <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                  <img src={post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '1/1', background: '#f8fafc', display: 'flex', alignItems: 'center', padding: '1rem', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                  {post.text?.slice(0, 80)}...
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>❤️ {post.likes?.length || 0}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>💬 {post.comments?.length || 0}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                  {post.views || 0} views • {(( (post.likes?.length || 0) + (post.comments?.length || 0) ) / (post.views || 1) * 100).toFixed(1)}% eng
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, color, trend }) {
  return (
    <div style={{ 
      padding: '1.75rem', 
      background: 'white', 
      borderRadius: '24px', 
      border: '1px solid #eee',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: color }}></div>
      <h4 style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>{title}</h4>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '4px' }}>{value}</div>
      {trend && <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{trend}</div>}
    </div>
  );
}
