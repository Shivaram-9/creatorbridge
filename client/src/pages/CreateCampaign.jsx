import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import "./CreateCampaign.css";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    requirements: "",
    hashtags: "",
    banner: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        hashtags: formData.hashtags.split(",").map(h => h.trim()),
      };
      const res = await api.campaigns.create(data);
      if (res.error) alert(res.error);
      else navigate("/campaigns");
    } catch (err) {
      alert("Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign-page">
      <div className="form-container">
        <h2>Create New Campaign</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campaign Banner URL</label>
            <input name="banner" value={formData.banner} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Campaign Title</label>
            <input name="title" required value={formData.title} onChange={handleChange} placeholder="Summer Collection Launch" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" required value={formData.category} onChange={handleChange}>
                <option value="">Select Category</option>
                <option value="Fashion">Fashion</option>
                <option value="Tech">Tech</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Food">Food</option>
              </select>
            </div>
            <div className="form-group">
              <label>Budget Range</label>
              <input name="budget" required value={formData.budget} onChange={handleChange} placeholder="$500 - $1000" />
            </div>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input name="deadline" type="date" required value={formData.deadline} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} rows="4"></textarea>
          </div>
          <div className="form-group">
            <label>Creator Requirements</label>
            <textarea name="requirements" required value={formData.requirements} onChange={handleChange} rows="3" placeholder="Min 10k followers, Fashion niche..."></textarea>
          </div>
          <div className="form-group">
            <label>Hashtags (comma separated)</label>
            <input name="hashtags" value={formData.hashtags} onChange={handleChange} placeholder="summer2024, fashion, branding" />
          </div>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Creating..." : "Launch Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
