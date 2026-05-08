import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from "recharts";
import "./BrandDashboard.css";

export default function BrandDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [dealList, analytics] = await Promise.all([
          api.deals.list(),
          api.analytics.getCampaigns()
        ]);
        setDeals(dealList);
        setStats(analytics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner centered />;

  const activeDeals = deals.filter(d => d.status === "active" || d.status === "negotiating");
  const completedDeals = deals.filter(d => d.status === "completed");
  
  const roiData = [
    { name: 'Influencer Fees', value: deals.reduce((sum, d) => sum + d.budget, 0) },
    { name: 'Estimated ROI', value: deals.reduce((sum, d) => sum + (d.budget * 2.4), 0) }, // Mock ROI logic
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="brand-dashboard container slide-in">
      <header className="dashboard-header">
        <div className="header-badge">ENTERPRISE CONSOLE</div>
        <h1>Campaign Intelligence</h1>
        <p>Monitor your active collaborations and measure campaign ROI.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="lbl">Active Campaigns</span>
          <h2 className="val">{stats?.active || 0}</h2>
        </div>
        <div className="stat-box">
          <span className="lbl">Negotiations</span>
          <h2 className="val">{deals.filter(d => d.status === 'negotiating').length}</h2>
        </div>
        <div className="stat-box">
          <span className="lbl">Creators Aligned</span>
          <h2 className="val">{deals.length}</h2>
        </div>
        <div className="stat-box accent">
          <span className="lbl">Avg. Engagement</span>
          <h2 className="val">6.2%</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card main-chart">
          <div className="card-header">
            <h3>Campaign Spend vs ROI</h3>
            <span className="badge">REAL-TIME</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {roiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-card creator-responses">
          <div className="card-header">
            <h3>Active Proposals</h3>
            <span className="badge">PENDING</span>
          </div>
          <div className="responses-list">
            {activeDeals.length === 0 ? (
              <div className="empty-msg">No active proposals yet.</div>
            ) : (
              activeDeals.map(deal => (
                <div key={deal._id} className="response-item">
                  <div className="resp-info">
                    <strong>{deal.influencer?.name || deal.influencer?.username}</strong>
                    <span>{deal.title}</span>
                  </div>
                  <span className={`resp-status ${deal.status}`}>{deal.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="performance-section">
        <h2 className="section-title">Top Performing Collaborators</h2>
        <div className="performers-grid">
          {completedDeals.slice(0, 3).map(deal => (
            <div key={deal._id} className="performer-card">
              <Avatar user={deal.influencer} size="md" />
              <div className="perf-info">
                <h4>{deal.influencer?.name || deal.influencer?.username}</h4>
                <p>Niche: Fashion & Lifestyle</p>
                <div className="perf-stats">
                  <span>ROI: 3.2x</span>
                  <span>Impact: 12k views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
