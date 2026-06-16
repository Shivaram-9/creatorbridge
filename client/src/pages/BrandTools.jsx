import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import toast from "react-hot-toast";
import "./BrandTools.css";

export default function BrandTools() {
  const [activeTool, setActiveTool] = useState("targeting");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    minFollowers: "",
    verifiedOnly: false
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await api.brand.getTargeting(filters);
      setResults(data);
    } catch {
      toast.error("Targeting search failed");
    } finally {
      setLoading(false);
    }
  };

  const addToComparison = (creator) => {
    if (comparison.find(c => c._id === creator._id)) return;
    if (comparison.length >= 3) return toast.error("Max 3 creators for comparison");
    setComparison([...comparison, creator]);
    toast.success("Added to comparison");
  };

  const getBudgetEstimate = (creators) => {
    // Simple logic: base rate * followers factor
    return creators.reduce((sum, c) => {
      const followers = c.followers?.length || 0;
      return sum + (500 + (followers * 0.5));
    }, 0).toFixed(2);
  };

  return (
    <div className="brand-tools-page container slide-in">
      <header className="page-header">
        <h1 className="page-title">Enterprise Brand Tools</h1>
        <p className="subtitle">Advanced discovery, comparison, and campaign planning tools.</p>
      </header>

      <nav className="tool-tabs">
        <button className={activeTool === 'targeting' ? 'active' : ''} onClick={() => setActiveTool('targeting')}>Audience Targeting</button>
        <button className={activeTool === 'compare' ? 'active' : ''} onClick={() => setActiveTool('compare')}>Creator Comparison</button>
        <button className={activeTool === 'reports' ? 'active' : ''} onClick={() => setActiveTool('reports')}>Performance Reports</button>
      </nav>

      <div className="tool-content">
        {activeTool === 'targeting' && (
          <div className="targeting-tool">
            <div className="search-sidebar card">
              <h3>Filters</h3>
              <div className="field">
                <label>Category</label>
                <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                  <option value="">All Categories</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Tech">Tech</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>
              <div className="field">
                <label>Min Followers</label>
                <input type="number" value={filters.minFollowers} onChange={e => setFilters({...filters, minFollowers: e.target.value})} placeholder="e.g. 1000" />
              </div>
              <label className="checkbox-field">
                <input type="checkbox" checked={filters.verifiedOnly} onChange={e => setFilters({...filters, verifiedOnly: e.target.checked})} />
                Verified Creators Only
              </label>
              <button className="btn btn-primary w-full" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Apply Filters"}
              </button>
            </div>

            <div className="search-results">
              {loading ? <LoadingSpinner /> : (
                <div className="creators-grid">
                  {results.map(c => (
                    <div key={c._id} className="creator-tool-card card">
                      <Avatar user={c} size="lg" />
                      <div className="card-info">
                        <h4>{c.name} {c.isVerified && <VerifiedBadge size="xs" role={c.role} />}</h4>
                        <p className="handle">@{c.username}</p>
                        <p className="category-tag">{c.category}</p>
                        <div className="card-stats">
                          <span><strong>{c.followers?.length}</strong> Followers</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => addToComparison(c)}>Compare</button>
                        <button className="btn btn-ghost btn-sm">Shortlist</button>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && !loading && <div className="empty-state">No creators match your criteria.</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTool === 'compare' && (
          <div className="comparison-tool">
            {comparison.length < 2 ? (
              <div className="empty-state card">
                <p>Add at least 2 creators from Targeting to compare them.</p>
              </div>
            ) : (
              <div className="comparison-table-container card">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {comparison.map(c => (
                        <th key={c._id}>
                          <Avatar user={c} size="sm" />
                          <span>{c.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Followers</td>
                      {comparison.map(c => <td key={c._id}>{c.followers?.length}</td>)}
                    </tr>
                    <tr>
                      <td>Category</td>
                      {comparison.map(c => <td key={c._id}>{c.category}</td>)}
                    </tr>
                    <tr>
                      <td>Engagement (Est)</td>
                      {comparison.map(c => <td key={c._id}>High</td>)}
                    </tr>
                    <tr>
                      <td>Estimated Budget</td>
                      {comparison.map(c => <td key={c._id}>₹{(500 + (c.followers?.length * 0.5)).toFixed(0)}</td>)}
                    </tr>
                  </tbody>
                </table>
                <div className="comparison-footer">
                  <div className="total-est">
                    <span>Total Campaign Estimate:</span>
                    <strong>₹{getBudgetEstimate(comparison)}</strong>
                  </div>
                  <button className="btn btn-primary">Send Bulk Proposal</button>
                  <button className="btn btn-ghost" onClick={() => setComparison([])}>Clear</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool === 'reports' && (
          <div className="reports-tool card">
             <div className="report-header">
                <h3>Campaign Performance</h3>
                <button className="btn btn-secondary">Download PDF</button>
             </div>
             <div className="performance-summary">
                <div className="metric">
                  <label>Active Collaborations</label>
                  <span>12</span>
                </div>
                <div className="metric">
                  <label>Total Reach</label>
                  <span>450K+</span>
                </div>
                <div className="metric">
                  <label>ROI Score</label>
                  <span className="text-success">8.4/10</span>
                </div>
             </div>
             <p className="muted">Detailed influencer-wise breakdown coming soon in the next iteration.</p>
          </div>
        )}
      </div>
    </div>
  );
}
