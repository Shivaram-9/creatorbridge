import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, HourglassIcon, BadgeCheckIcon, RocketIcon, BriefcaseIcon } from "../components/Icons.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import "./ApplyVerification.css";

export default function ApplyVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    category: user?.category || "",
    instagram: user?.instagram || "",
    youtube: user?.youtube || "",
    twitter: "",
    other: "",
  });
  const [idFile, setIdFile] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await api.verification.status();
      setRequest(data);
    } catch {
      setError("Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idFile) return toast.error("ID proof is required");
    
    setSubmitting(true);
    const fd = new FormData();
    fd.append("idProof", idFile);
    fd.append("category", formData.category);
    fd.append("socialLinks", JSON.stringify({
      instagram: formData.instagram,
      youtube: formData.youtube,
      twitter: formData.twitter,
      other: formData.other
    }));

    try {
      const res = await api.verification.apply(fd);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Verification request submitted!");
        setRequest(res);
      }
    } catch {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="verification-page container slide-in">
      <header className="page-header">
        <h1 className="page-title">Creator Verification</h1>
        <p className="subtitle">Build trust and unlock exclusive enterprise opportunities.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="verification-grid">
        <div className="verification-form-container card">
          {request && request.status !== "none" ? (
            <div className="status-display">
              <div className={`status-badge-large ${request.status}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                {request.status === "pending" && <><HourglassIcon /> Pending Review</>}
                {request.status === "approved" && <><CheckCircleIcon /> Verified</>}
                {request.status === "rejected" && <><XCircleIcon /> Rejected</>}
              </div>
              <p className="status-text">
                {request.status === "pending" && "Our admin team is reviewing your application. This usually takes 2-3 business days."}
                {request.status === "approved" && "Congratulations! You are now a verified Pactogram partner."}
                {request.status === "rejected" && `Reason: ${request.adminNotes || "Not specified."}`}
              </p>
              {request.status === "rejected" && (
                <button className="btn btn-primary" onClick={() => setRequest({ status: "none" })}>Try Again</button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="v-form">
              <section className="form-section">
                <h3>Identity Verification</h3>
                <div className="field">
                  <label>ID Proof (Govt. ID / Passport)</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setIdFile(e.target.files[0])} required />
                  <p className="helper-text">Upload a clear photo of your government-issued ID.</p>
                </div>
                <div className="field">
                  <label>Content Category</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    placeholder="e.g. Fashion, Tech, Lifestyle"
                    required
                  />
                </div>
              </section>

              <section className="form-section">
                <h3>Social Presence</h3>
                <div className="field-group">
                  <div className="field">
                    <label>Instagram Handle</label>
                    <input 
                      type="text" 
                      value={formData.instagram} 
                      onChange={e => setFormData({...formData, instagram: e.target.value})} 
                      placeholder="@username"
                    />
                  </div>
                  <div className="field">
                    <label>YouTube Channel</label>
                    <input 
                      type="text" 
                      value={formData.youtube} 
                      onChange={e => setFormData({...formData, youtube: e.target.value})} 
                      placeholder="Channel URL"
                    />
                  </div>
                </div>
              </section>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          )}
        </div>

        <div className="verification-info card">
          <h3>Why get verified?</h3>
          <ul className="v-benefits">
            <li>
              <span className="v-icon" style={{ display: 'flex' }}><BadgeCheckIcon /></span>
              <div>
                <strong>Blue Badge</strong>
                <p>Gain instant credibility with brands and followers.</p>
              </div>
            </li>
            <li>
              <span className="v-icon" style={{ display: 'flex' }}><RocketIcon /></span>
              <div>
                <strong>Priority in Discovery</strong>
                <p>Verified creators appear higher in brand searches.</p>
              </div>
            </li>
            <li>
              <span className="v-icon" style={{ display: 'flex' }}><BriefcaseIcon /></span>
              <div>
                <strong>Premium Opportunities</strong>
                <p>Access high-end campaigns limited to verified creators.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
