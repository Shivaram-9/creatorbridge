import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./CreateCampaign.css";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    budget: "",
    creatorsNeeded: "",
    deadline: "",
    description: "",
    attachments: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        budget: formData.budget,
        deadline: formData.deadline,
        description: formData.description,
        requirements: formData.description, // Requirements is required by backend, map description to it for now
        banner: formData.attachments || ""
      };
      
      const res = await api.campaigns.create(payload);
      if (res.error) throw new Error(res.error);
      
      toast.success("Campaign Published!");
      navigate("/campaigns"); // Navigate to campaigns list instead of dashboard to see the new campaign
    } catch (err) {
      toast.error(err.message || "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign-page container slide-in" style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="form-container card" style={{ padding: '32px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>+ Create Campaign</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600' }}>Campaign Title</label>
            <input name="title" required value={formData.title} onChange={handleChange} placeholder="Instagram Reel for Coffee Brand" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600' }}>Category</label>
            <select name="category" required value={formData.category} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
              <option value="">Select Category</option>
              <option value="Instagram Reel">Instagram Reel</option>
              <option value="YouTube">YouTube</option>
              <option value="UGC">UGC</option>
              <option value="Photography">Photography</option>
              <option value="Event">Event</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontWeight: '600' }}>Budget</label>
              <input name="budget" required value={formData.budget} onChange={handleChange} placeholder="₹10,000" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontWeight: '600' }}>Creators Needed</label>
              <input name="creatorsNeeded" type="number" required value={formData.creatorsNeeded} onChange={handleChange} placeholder="5" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600' }}>Deadline</label>
            <input name="deadline" type="date" required value={formData.deadline} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600' }}>Description</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} rows="4" placeholder="Looking for creators to make one Instagram Reel." style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'vertical' }}></textarea>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600' }}>Attachments (Optional)</label>
            <input name="attachments" value={formData.attachments} onChange={handleChange} placeholder="Link to Brand Logo, Product Images, or Brief" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
          </div>

          <button type="submit" disabled={loading} style={{ background: '#2563EB', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? "Publishing..." : "Publish Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
