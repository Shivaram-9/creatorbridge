import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreatePost from './CreatePost.jsx';
import { api } from '../services/api.js';

export default function GlobalPostModal({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const isCreating = searchParams.get('create') === 'true';

  useEffect(() => {
    if (isCreating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCreating]);

  if (!isCreating) return null;

  const close = () => {
    const params = new URLSearchParams(location.search);
    params.delete('create');
    navigate(location.pathname + '?' + params.toString(), { replace: true });
  };

  const handlePost = async (formData) => {
    try {
      import('react-hot-toast').then(m => {
        const toast = m.default;
        toast.promise(api.posts.create(formData), {
          loading: 'Creating post...',
          success: () => {
            close();
            if (location.pathname === '/home') {
              window.location.reload();
            }
            return 'Post created!';
          },
          error: 'Failed to create post'
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm global-modal-overlay" onClick={close}>
      <div className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-lg m-4 shadow-2xl relative global-modal-dialog" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-xl font-bold" onClick={close} style={{ zIndex: 10 }}>
          &times;
        </button>
        <div className="p-6 global-modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-0">Create Post</h2>
        </div>
        <div className="p-6 global-modal-body">
          <CreatePost user={user} onPost={handlePost} />
        </div>
      </div>
    </div>
  );
}
