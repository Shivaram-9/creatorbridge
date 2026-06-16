import { memo, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon, MoreHorizontalIcon } from "./Icons.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import ReportModal from "./ReportModal.jsx";
import MediaGallery from "./MediaGallery.jsx";
import "./PostCard.css";
import Lightbox from "./Lightbox.jsx";
import CollectionModal from "./CollectionModal.jsx";
import UserListModal from "./UserListModal.jsx";
import toast from "react-hot-toast";

const PostCard = memo(function PostCard({ post, onDelete, onUpdate }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const initialLiked = useMemo(() => {
    if (!user || !post.likes) return false;
    return post.likes.some(l => (l._id || l) === user._id);
  }, [user, post.likes]);

  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes : []);
  const likesCount = likes.length;
  
  const initialSaved = useMemo(() => {
    if (!user || !user.savedPosts) return false;
    return user.savedPosts.some(id => id.toString() === post._id);
  }, [user, post._id]);

  const [saved, setSaved] = useState(initialSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [shareStatus, setShareStatus] = useState("Share");
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const cardRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [localViews, setLocalViews] = useState(post?.views || 0);

  useEffect(() => {
    if (!post || hasTrackedView || !cardRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasTrackedView(true);
        api.posts.trackView(post._id).catch(() => {});
        setLocalViews(prev => prev + 1);
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [hasTrackedView, post]);

  if (!post) return null;

  const isOwner = user?._id === (post.user?._id || post.user);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await api.posts.remove(post._id);
      if (res?.error) {
        toast.error(res.error);
        setIsDeleting(false);
      } else {
        onDelete?.(post._id);
      }
    } catch {
      toast.error("Failed to delete post");
      setIsDeleting(false);
    }
  };

  const handlePin = async () => {
    try {
      const res = await api.posts.pin(post._id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(post.isPinned ? "Unpinned" : "Pinned to Profile");
        onUpdate?.(res);
      }
    } catch (err) {
      alert("Failed to pin post");
    }
    setShowMenu(false);
  };

  const handleArchive = async () => {
    try {
      const res = await api.posts.archive(post._id);
      if (res.error) alert(res.error);
      else onUpdate?.(res);
    } catch (err) {
      alert("Failed to archive post");
    }
    setShowMenu(false);
  };

  const handleEdit = async () => {
    try {
      const res = await api.posts.update(post._id, { content: editContent });
      if (res.error) alert(res.error);
      else {
        onUpdate?.(res);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update post");
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      const res = await api.posts.like(post._id);
      if (res?.error) setLiked(!newLiked);
      else setLikes(res.likes);
    } catch {
      setLiked(!newLiked);
    }
  };

  const handleShare = () => setShowShareModal(true);

  const handleShareToUser = async (targetUser) => {
    try {
      const postUrl = `${window.location.origin}/post/${post._id}`;
      const res = await api.messages.send({
        receiverId: targetUser._id,
        content: `Check out this post: ${postUrl}`
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Shared with @${targetUser.username}!`);
        setShowShareModal(false);
      }
    } catch (err) {
      toast.error("Failed to share post");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    const text = commentText;
    setCommentText("");
    try {
      const res = await api.posts.comment(post._id, text);
      if (!res?.error) setComments(prev => [...prev, res]);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const res = await api.posts.save(post._id);
      if (res?.error) setSaved(!newSaved);
      else {
        const updatedSaved = newSaved 
          ? [...(user.savedPosts || []), post._id] 
          : (user.savedPosts || []).filter(id => id.toString() !== post._id);
        setUser({ ...user, savedPosts: updatedSaved });
      }
    } catch (err) {
      setSaved(!newSaved);
    }
  };

  useEffect(() => {
    if (post?._id && api?.analytics?.viewPost) {
      api.analytics.viewPost(post._id).catch(() => {});
    }
  }, [post?._id]);

  const mediaList = useMemo(() => {
    if (post.media && post.media.length > 0) return post.media.map(m => m.startsWith("http") ? m : `${api.getResolvedApiOrigin()}${m}`);
    if (post.image) return [post.image.startsWith("http") ? post.image : `${api.getResolvedApiOrigin()}${post.image}`];
    return [];
  }, [post.media, post.image]);

  return (
    <div ref={cardRef} className={`bg-white border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md hover:border-slate-300 ${post.isPinned ? "ring-2 ring-blue-100" : ""} animate-fade-in`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <Avatar user={post.user} size="md" onClick={() => navigate(`/user/${post.user?._id}`)} className="cursor-pointer" />
          <div>
            <h3 className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1" onClick={() => navigate(`/user/${post.user?._id}`)}>
              {post.user?.name || post.username}
              {(post.user?.isVerified || post.user?.isPremium) && <VerifiedBadge size="sm" tier={post.user?.premiumTier} role={post.user?.role} />}
            </h3>
            <p className="text-sm text-slate-500">{post.user?.role || "Creator / Builder"} • {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="relative">
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontalIcon />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
              {isOwner ? (
                <>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setIsEditing(true); setShowMenu(false); }}>Edit Project</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={handlePin}>{post.isPinned ? "Unpin" : "Pin to Profile"}</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={handleArchive}>Archive</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold" onClick={handleDelete} disabled={isDeleting}>Delete</button>
                </>
              ) : (
                <>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setShowCollectionModal(true); setShowMenu(false); }}>Save to Collection</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => { setShowReportModal(true); setShowMenu(false); }}>Report</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <textarea
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows="3"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button className="px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="px-4 py-1.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg" onClick={handleEdit}>Save</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
            
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {post.hashtags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Thumbnail */}
      {mediaList.length > 0 && (
        <div className="mb-4 -mx-6 sm:mx-0 sm:rounded-xl overflow-hidden border-y sm:border border-slate-200 bg-black cursor-pointer" onClick={() => setShowLightbox(true)}>
          <MediaGallery media={mediaList} />
        </div>
      )}

      {/* Stats / Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-6">
          <button className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${liked ? "text-red-500" : "text-slate-500 hover:text-slate-700"}`} onClick={handleLike}>
            <HeartIcon filled={liked} /> <span>{likesCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors" onClick={() => setShowComments(!showComments)}>
            <MessageCircleIcon /> <span>{post.comments?.length || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>{localViews}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className={`p-2 rounded-lg transition-colors ${saved ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:bg-slate-50"}`} onClick={handleSave}>
            <BookmarkIcon filled={saved} />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors" onClick={handleShare}>
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Comments Dropdown */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2 text-sm mb-2">
              <span className="font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/user/${c.user?._id || c.user}`)}>
                {c.username || c.user?.name || "User"}:
              </span>
              <span className="text-slate-600">{c.text}</span>
            </div>
          ))}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-3">
            <input 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Add a comment..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
            />
            <button type="submit" className="text-sm font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50" disabled={!commentText.trim()}>Post</button>
          </form>
        </div>
      )}

      {showLightbox && (
        <Lightbox 
          media={mediaList} 
          startIndex={lightboxIndex} 
          onClose={() => setShowLightbox(false)} 
        />
      )}

      {showReportModal && (
        <ReportModal 
          targetType="post"
          targetId={post._id} 
          onClose={() => setShowReportModal(false)} 
        />
      )}

      {showCollectionModal && (
        <CollectionModal
          postId={post._id}
          onClose={() => setShowCollectionModal(false)}
        />
      )}

      {showShareModal && (
        <UserListModal
          title="Share Post"
          users={user?.following || []}
          onClose={() => setShowShareModal(false)}
          onSelectUser={handleShareToUser}
          actionLabel={shareStatus}
        />
      )}
    </div>
  );
});

export default PostCard;
