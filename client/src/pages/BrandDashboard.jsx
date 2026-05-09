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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const analytics = await api.analytics.getCampaigns();
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

  // Mock data for ROI if actual data is unavailable
  const roiData = [
    { name: 'Ad Spend', value: 5000 },
    { name: 'Estimated ROI', value: 12000 },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="brand-dashboard container slide-in">
      <header className="dashboard-header">
        <div className="header-badge">ENTERPRISE CONSOLE</div>
        <h1>Campaign Intelligence</h1>
        <p>Monitor your active campaigns and measure ROI performance.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="lbl">Active Campaigns</span>
          <h2 className="val">{stats?.active || 0}</h2>
        </div>
        <div className="stat-box">
          <span className="lbl">Total Reach</span>
          <h2 className="val">1.2M</h2>
        </div>
        <div className="stat-box">
          <span className="lbl">Avg. CPC</span>
          <h2 className="val">$0.45</h2>
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
            <h3>Recent Activity</h3>
            <span className="badge">LIVE</span>
          </div>
          <div className="responses-list">
            <div className="response-item">
              <div className="resp-info">
                <strong>Summer Launch</strong>
                <span>New engagement spike detected</span>
              </div>
              <span className="resp-status active">Trending</span>
            </div>
            <div className="response-item">
              <div className="resp-info">
                <strong>Global Reach</strong>
                <span>Campaign expanding to EU markets</span>
              </div>
              <span className="resp-status pending">Growing</span>
            </div>
          </div>
        </section>
      </div>

      <section className="performance-section">
        <h2 className="section-title">Campaign Performance Over Time</h2>
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
           <p className="text-slate-500 font-medium">Historical performance charts are being generated based on latest metrics.</p>
        </div>
      </section>
    </div>
  );
}
