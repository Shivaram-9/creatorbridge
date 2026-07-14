import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import ApplyCampaignModal from "../components/ApplyCampaignModal.jsx";

import StoriesBar from "../components/StoriesBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedUserDisplay from "../components/VerifiedUserDisplay.jsx";
import VerifiedPill from "../components/VerifiedPill.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { HandshakeIcon } from "../components/Icons.jsx";
import toast from "react-hot-toast";
import "./Home.css";

import { Users, Clock, CheckCircle2 } from 'lucide-react';

function TrendingCampaigns({ user }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const campaigns = [
    { id: 1, logo: 'N', logoBg: '#000', name: 'Nike', type: 'Fitness Challenge Campaign', budget: '₹40,000 Budget', creators: '15 Creators Needed', daysLeft: '2 Days Left', btnColor: '#eab308' },
    { id: 2, logo: 'Samsung', logoBg: '#1d4ed8', logoColor: '#fff', name: 'Samsung', type: 'UGC Product Review Campaign', budget: '₹12,000 Budget', creators: '10 Creators Needed', daysLeft: '5 Days Left', btnColor: '#2563EB' },
    { id: 3, logo: 'Minimalist', logoBg: '#f8fafc', logoColor: '#000', name: 'Minimalist', type: 'Skincare Awareness Campaign', budget: '₹20,000 Budget', creators: '8 Creators Needed', daysLeft: '4 Days Left', btnColor: '#16a34a' },
    { id: 4, logo: 'boAt', logoBg: '#000', logoColor: '#fff', name: 'boAt', type: 'Lifestyle Product Campaign', budget: '₹15,000 Budget', creators: '12 Creators Needed', daysLeft: '6 Days Left', btnColor: '#7c3aed' },
  ];

  return (
    <div className="trending-campaigns-section" style={{ width: '100%', overflow: 'hidden', padding: '16px 0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h3 className="trending-campaigns-header" style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            🔥 Trending Campaigns
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Top opportunities brands are offering right now.</span>
        </div>
        <a href="#" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none', fontWeight: 600, marginTop: '2px' }}>View all &gt;</a>
      </div>
      <div className="trending-scroll-container">
        {campaigns.map(camp => (
          <div key={camp.id} className="trending-card new-trending-layout" style={{ position: 'relative', background: 'var(--bg-secondary)', border: 'none', borderRadius: '16px', padding: '16px' }}>
            <div className="trending-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: camp.logoBg, color: camp.logoColor || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', overflow: 'hidden' }}>
                {camp.logo === 'Samsung' ? 'S' : (camp.logo === 'Minimalist' ? 'M' : camp.logo)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '15px' }}>
                {camp.name}
                <CheckCircle2 size={14} fill="#3b82f6" color="#fff" />
              </div>
            </div>
            
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', minHeight: '40px' }}>
              {camp.type}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', borderRadius: '6px', fontSize: '12px', fontWeight: 700, alignSelf: 'flex-start' }}>
                {camp.budget}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                <Users size={14} /> {camp.creators}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                <Clock size={14} /> {camp.daysLeft}
              </div>
            </div>

            <button 
              style={{ width: '100%', padding: '10px', background: camp.btnColor, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              onClick={(e) => { e.preventDefault(); setSelectedCampaign({ ...camp, title: camp.type }); }}
            >
              Apply Now →
            </button>
          </div>
        ))}
      </div>
      
      {selectedCampaign && (
        <ApplyCampaignModal 
          user={user}
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onSubmit={(data) => {
            console.log('Application submitted:', data);
            setSelectedCampaign(null);
            toast.success("Application submitted!");
          }}
        />
      )}
    </div>
  );
}

function VerificationBanner({ onClose, onVerify }) {
  return (
    <div className="verification-banner-mobile">
      <div className="banner-icon">💎</div>
      <div className="banner-text">
        <h3>Get verified and unlock more opportunities</h3>
        <p>Build trust and stand out to brands.</p>
      </div>
      <button className="banner-action-btn" onClick={onVerify}>Get Verified</button>
      <button className="banner-close-btn" onClick={onClose}>✕</button>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("For You");
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [showFeedDropdown, setShowFeedDropdown] = useState(false);
  const [suggestedVerifiedUsers, setSuggestedVerifiedUsers] = useState([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState([]);

  const loadVerifiedUsers = useCallback(async () => {
    try {
      const data = await api.users.getVerified();
      if (!data?.error && Array.isArray(data)) {
        const others = data.filter(u => {
          if (u._id === user?._id) return false;
          if (u.role === 'admin') return false;
          
          const name = (u.name || '').toLowerCase();
          const username = (u.username || '').toLowerCase();
          if (name.includes('admin') || username.includes('admin')) return false;
          if (name.includes('test') || username.includes('test')) return false;
          
          return true;
        }).slice(0, 3);
        setSuggestedVerifiedUsers(others);
      }
    } catch { /* silent */ }
  }, [user]);

  const loadRelatedSuggestions = useCallback(async () => {
    try {
      const data = await api.users.getRelatedSuggestions();
      if (!data?.error && Array.isArray(data)) {
        setRelatedSuggestions(data);
      }
    } catch { /* silent */ }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.posts.list({ _t: Date.now() });
      if (data?.error) {
        if (!data.error.includes("invalid response")) {
          toast.error(data.error);
        }
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("We couldn't load your feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadVerifiedUsers();
    loadRelatedSuggestions();
    
    // Refresh posts when a post is created from the sidebar
    const handlePostCreated = () => loadPosts();
    window.addEventListener("postCreated", handlePostCreated);
    
    const interval = setInterval(loadPosts, 120000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("postCreated", handlePostCreated);
    };
  }, [loadPosts, loadVerifiedUsers, loadRelatedSuggestions]);

  const handleAddPost = async (formData) => {
    try {
      const res = await api.posts.create(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Post published!");
        loadPosts();
      }
    } catch (err) {
      console.error("Alliance feed error:", err);
      toast.error("Failed to create post");
    }
  };

  const formatPost = (post) => {
    if (!post) return null;
    return {
      ...post,
      username: post.user?.username || post.user?.name || "User",
      avatar: post.user?.avatar || null,
      isVerified: post.user?.isVerified || false,
    };
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "All Feed") return true;
    if (activeTab === "Following") {
      // Assuming user object has following array with user ids
      if (!user?.following) return true; // fallback
      return user.following.includes(post.user?._id || post.user);
    }
    if (activeTab === "For You") return true;
    if (activeTab === "Latest") return true;
    if (activeTab === "Brands") return post.user?.role === "brand";
    if (activeTab === "Creators") return post.user?.role === "creator";
    if (activeTab === "Trending") return (post.likes?.length || 0) > 0;
    if (activeTab === "Nearby") return true;
    return true;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="home-grid">
      {/* Main Feed Column */}
      <div className="feed-col">




        <TrendingCampaigns user={user} />
        
        {/* Feed Tabs Pills */}
        <div className="feed-tabs-pills">
          {["For You", "Latest", "Brands", "Creators", "Trending", "Nearby"].map(tab => (
            <button 
              key={tab}
              className={`feed-tab-pill ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <>
            <div className="home-feed-posts">

            {filteredPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={formatPost(post)} 
                    onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="Welcome! Your Alliance Feed is Empty"
                message="Connect with creators and brands to see their latest posts here!"
                actionText="Discover Creators"
                onAction={() => navigate("/discover")}
                icon={<HandshakeIcon />}
              />
            )}
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar Column */}
      <div className="home-sidebar-col">
        {/* Unified Profile & Suggestions Widget */}
        <div className="w-full max-w-full py-2">
          
          {/* Profile Section */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar user={user} size="sm" />
            <div>
              <VerifiedUserDisplay 
                user={user}
                nameComponent={
                  <h3 className={`font-bold text-lg cursor-pointer transition-colors text-slate-900 dark:text-white`}>
                    {user?.name || user?.username}
                  </h3>
                }
              />
              {!(user?.isVerified || user?.isPremium) && (
                <div className="mt-1">
                  <VerifiedPill user={user} fallbackText={user?.role === 'brand' ? 'Brand' : 'Creator'} />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm py-3 border-t border-slate-100 dark:border-[#262626]/50">
            <span className="text-slate-500 dark:text-slate-400">Profile Views</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.profileViews || 0}</span>
          </div>

          <div className="border-t border-slate-100 dark:border-[#262626]/50 my-2"></div>

          {/* Suggested Connections Section */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Suggested Connections</h3>
            <div className="flex flex-col gap-4">
              {suggestedVerifiedUsers.length > 0 ? suggestedVerifiedUsers.map(u => (
                <div key={u._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div onClick={() => navigate(`/user/${u._id}`)} className="cursor-pointer">
                      <Avatar user={u} size="sm" />
                    </div>
                    <div className="cursor-pointer" onClick={() => navigate(`/user/${u._id}`)}>
                      <VerifiedUserDisplay 
                        user={u}
                        nameComponent={
                          <h4 className={`font-bold transition-colors text-slate-900 dark:text-white`}>
                            {u.name || u.username}
                          </h4>
                        }
                      />
                      {!(u?.isVerified || u?.isPremium) && (
                        <div className="mt-1">
                          <VerifiedPill user={u} fallbackText={u.role || 'Creator'} />
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/user/${u._id}`)}
                    className="text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    View
                  </button>
                </div>
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No verified users found.</div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#262626]/50 my-3"></div>

          {/* Related Suggestions Section */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Related Suggestions</h3>
            <div className="flex flex-col gap-4">
              {relatedSuggestions.length > 0 ? relatedSuggestions.map(u => (
                <div key={u._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div onClick={() => navigate(`/user/${u._id}`)} className="cursor-pointer">
                      <Avatar user={u} size="sm" />
                    </div>
                    <div className="cursor-pointer" onClick={() => navigate(`/user/${u._id}`)}>
                      <VerifiedUserDisplay 
                        user={u}
                        nameComponent={
                          <h4 className={`font-bold transition-colors text-slate-900 dark:text-white`}>
                            {u.name || u.username}
                          </h4>
                        }
                      />
                      {!(u?.isVerified || u?.isPremium) && (
                        <div className="mt-1">
                          <VerifiedPill user={u} fallbackText={u.role || 'Creator'} />
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/user/${u._id}`)}
                    className="text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    View
                  </button>
                </div>
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No related suggestions found.</div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#262626]/50 my-3"></div>

          <button onClick={() => navigate('/discover')} className="w-full text-center text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-slate-200 transition-colors">
            View all recommendations
          </button>
        </div>

        {/* Footer Links */}
        <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-2 mt-2 px-2">
          <a href="#" className="hover:text-slate-600 transition-colors">About</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Accessibility</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Help Center</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy & Terms</a>
          <span>Pactogram © 2026</span>
        </div>
      </div>
    </div>
  );
}
