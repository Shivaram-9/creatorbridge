import React from 'react';
import { Link } from 'react-router-dom';

export default function RightPanel() {
  return (
    <div className="hidden lg:flex flex-col w-[300px] flex-shrink-0 p-6 space-y-8 border-l border-slate-200 bg-white min-h-screen sticky top-0">
      
      {/* Trending Projects */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Trending Projects</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-start group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                P{i}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">Project Apollo Next-Gen</h4>
                <p className="text-xs text-slate-500 mt-0.5">by Creator Labs</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Creators */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Top Creators</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Alex Studio</h4>
                  <p className="text-xs text-slate-500">UI/UX Designer</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Upcoming Events</h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">Join the next Web3 Creators Summit this Friday at 10 AM PST.</p>
          <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            RSVP Now
          </button>
        </div>
      </section>
      
      <footer className="text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
        <Link to="/about" className="hover:text-slate-600">About</Link>
        <Link to="/privacy" className="hover:text-slate-600">Privacy</Link>
        <Link to="/terms" className="hover:text-slate-600">Terms</Link>
        <span className="w-full block mt-2">&copy; 2026 Pactogram</span>
      </footer>
    </div>
  );
}
