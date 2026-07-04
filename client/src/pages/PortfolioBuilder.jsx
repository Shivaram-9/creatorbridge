import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import CreatorTemplateOne from "../components/portfolio-templates/CreatorTemplateOne.jsx";
import CreatorTemplateTwo from "../components/portfolio-templates/CreatorTemplateTwo.jsx";
import CreatorTemplateThree from "../components/portfolio-templates/CreatorTemplateThree.jsx";
import CreatorTemplateFour from "../components/portfolio-templates/CreatorTemplateFour.jsx";
import BrandTemplateOne from "../components/portfolio-templates/BrandTemplateOne.jsx";
import BrandTemplateTwo from "../components/portfolio-templates/BrandTemplateTwo.jsx";
import BrandTemplateThree from "../components/portfolio-templates/BrandTemplateThree.jsx";
import BrandTemplateFour from "../components/portfolio-templates/BrandTemplateFour.jsx";
import * as Generated from "../components/portfolio-templates/generated/index.js";

const CREATOR_LAYOUT_NAMES = [
  "Dynamic Showcase", "Visual Journey", "Modern Canvas", "Artistic Flourish", "Clean Perspective",
  "Bold Statement", "Fluid Motion", "Urban Edge", "Organic Flow", "Tech Minimalist",
  "Vibrant Palette", "Cinematic View", "Elegant Grid", "Geometric Focus", "Neon Highlights",
  "Soft Horizons", "Abstract Space", "Structured Clarity", "Retro Vintage", "Future Forward"
];

const BRAND_LAYOUT_NAMES = [
  "Enterprise Authority", "Market Leader", "Strategic Vision", "Premium Corporate", "Trust & Heritage",
  "Innovation Hub", "Global Reach", "Executive Summary", "Apex Solutions", "Vanguard Design",
  "Pinnacle Professional", "Synergy Platform", "Corporate Canvas", "Foundation Builder", "Horizon Ventures",
  "Momentum Drive", "Blueprint Standard", "Summit Strategy", "Nexus Network", "Paramount Focus"
];

const DEFAULT_DATA = {
  personal: { name: "", title: "", email: "", phone: "", location: "", summary: "", website: "" },
  experience: [], // { id, company, role, startDate, endDate, description }
  education: [],  // { id, institution, degree, year }
  skills: [],     // [string, string]
  projects: [],   // { id, title, description, link }
  achievements: [] // { id, title, description }
};

export default function PortfolioBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState(DEFAULT_DATA);
  const [activeTab, setActiveTab] = useState("personal");
  const [templateType, setTemplateType] = useState(user?.role === "brand" ? "brand" : "creator");
  const [selectedTemplateId, setSelectedTemplateId] = useState("creator-1");
  const printRef = useRef(null);

  useEffect(() => {
    if (user?.role === "brand") setSelectedTemplateId("brand-1");
    else setSelectedTemplateId("creator-1");
    
    api.users.me().then(res => {
      if (!res.error && res.portfolioDetails && Object.keys(res.portfolioDetails).length > 0) {
        setData({ ...DEFAULT_DATA, ...res.portfolioDetails });
      } else {
        setData(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            name: res.name || "",
            title: res.category || "",
            email: res.email || "",
            location: res.location || "",
            summary: res.bio || "",
            website: res.website || ""
          }
        }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const res = await api.users.updatePortfolioDetails(data);
    if (res.error) toast.error(res.error);
    else toast.success("Portfolio details saved");
    setSaving(false);
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    toast.loading("Generating PDF...", { id: "pdf" });
    
    await api.users.updatePortfolioDetails(data);

    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: `${data.personal.name.replace(/\s+/g, '_') || 'My'}_Portfolio.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      toast.success("PDF Downloaded successfully", { id: "pdf" });
      setGenerating(false);
    }).catch(err => {
      console.error(err);
      toast.error("Failed to generate PDF", { id: "pdf" });
      setGenerating(false);
    });
  };

  const updatePersonal = (field, val) => setData(prev => ({ ...prev, personal: { ...prev.personal, [field]: val } }));
  const addArrayItem = (key, item) => setData(prev => ({ ...prev, [key]: [...prev[key], { id: Date.now().toString(), ...item }] }));
  const removeArrayItem = (key, id) => setData(prev => ({ ...prev, [key]: prev[key].filter(i => i.id !== id) }));
  const updateArrayItem = (key, id, field, val) => setData(prev => ({
    ...prev, [key]: prev[key].map(i => i.id === id ? { ...i, [field]: val } : i)
  }));
  const addSkill = (skill) => {
    if (!skill.trim() || data.skills.includes(skill.trim())) return;
    setData(prev => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
  };
  const removeSkill = (skill) => setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));

  if (loading) return <LoadingSpinner centered />;

  const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:text-white outline-none";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col pt-16">
      
      {/* Sleek Header */}
      <div className="bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex justify-between items-center sticky top-16 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/profile')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium flex items-center gap-2 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700"></div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Portfolio Builder</h1>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <select value={templateType} onChange={(e) => { setTemplateType(e.target.value); setSelectedTemplateId(e.target.value === "brand" ? "brand-1" : "creator-1"); }} className="py-2 px-3 bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none">
              <option value="creator" className="dark:bg-slate-800 dark:text-white">Creator Templates</option>
              <option value="brand" className="dark:bg-slate-800 dark:text-white">Brand Templates</option>
            </select>
            
            <div className="w-[1px] bg-slate-300 dark:bg-slate-600 my-2 mx-1"></div>

            <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="py-2 px-3 bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none max-w-[200px]">
              {templateType === "creator" ? (
                <>
                  <option value="creator-1" className="dark:bg-slate-800 dark:text-white">Creative Professional</option>
                  <option value="creator-2" className="dark:bg-slate-800 dark:text-white">Minimalist Modern</option>
                  <option value="creator-3" className="dark:bg-slate-800 dark:text-white">Vibrant Portfolio</option>
                  <option value="creator-4" className="dark:bg-slate-800 dark:text-white">Editorial Elegance</option>
                  {CREATOR_LAYOUT_NAMES.map((name, i) => (
                    <option key={`c-${i+1}`} value={`gen-creator-${i+1}`} className="dark:bg-slate-800 dark:text-white">{name}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="brand-1" className="dark:bg-slate-800 dark:text-white">Corporate Profile</option>
                  <option value="brand-2" className="dark:bg-slate-800 dark:text-white">Agency Brief</option>
                  <option value="brand-3" className="dark:bg-slate-800 dark:text-white">Bold Impact</option>
                  <option value="brand-4" className="dark:bg-slate-800 dark:text-white">Classic Heritage</option>
                  {BRAND_LAYOUT_NAMES.map((name, i) => (
                    <option key={`b-${i+1}`} value={`gen-brand-${i+1}`} className="dark:bg-slate-800 dark:text-white">{name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 dark:bg-transparent dark:hover:bg-blue-900/30 transition-all">{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={handleDownloadPdf} disabled={generating} className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">{generating ? "Generating..." : "Download PDF"}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        
        {/* Left Form Sidebar */}
        <div className="w-1/3 min-w-[380px] bg-white dark:bg-[#171717] border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
          
          <div className="flex px-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto overflow-y-hidden gap-8 scrollbar-hide">
            {['personal', 'experience', 'education', 'skills', 'projects'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`py-4 text-[13px] font-bold uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab ? 'text-blue-600 dark:text-blue-500' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
          
          <div className="p-8">
            {activeTab === 'personal' && (
              <div className="space-y-6 fade-in">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input className={inputClass} placeholder="e.g. Jane Doe" value={data.personal.name} onChange={e => updatePersonal('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Professional Title</label>
                  <input className={inputClass} placeholder="e.g. Senior Designer" value={data.personal.title} onChange={e => updatePersonal('title', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input className={inputClass} placeholder="jane@example.com" value={data.personal.email} onChange={e => updatePersonal('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input className={inputClass} placeholder="+1 (555) 000-0000" value={data.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input className={inputClass} placeholder="New York, NY" value={data.personal.location} onChange={e => updatePersonal('location', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Website / Portfolio URL</label>
                  <input className={inputClass} placeholder="www.janedoe.com" value={data.personal.website} onChange={e => updatePersonal('website', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Professional Summary</label>
                  <textarea className={`${inputClass} min-h-[140px] resize-y`} placeholder="Write a brief introduction about yourself..." value={data.personal.summary} onChange={e => updatePersonal('summary', e.target.value)} />
                </div>
              </div>
            )}
            
            {activeTab === 'experience' && (
              <div className="space-y-8 fade-in">
                {data.experience.map((exp, index) => (
                  <div key={exp.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl relative shadow-sm transition-all hover:shadow-md">
                    <button onClick={() => removeArrayItem('experience', exp.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Experience #{index + 1}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Company / Brand Name</label>
                        <input className={inputClass} placeholder="Company Name" value={exp.company} onChange={e => updateArrayItem('experience', exp.id, 'company', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Role / Job Title</label>
                        <input className={inputClass} placeholder="e.g. Creative Director" value={exp.role} onChange={e => updateArrayItem('experience', exp.id, 'role', e.target.value)} />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className={labelClass}>Start Date</label>
                          <input className={inputClass} placeholder="MMM YYYY" value={exp.startDate} onChange={e => updateArrayItem('experience', exp.id, 'startDate', e.target.value)} />
                        </div>
                        <div className="w-1/2">
                          <label className={labelClass}>End Date</label>
                          <input className={inputClass} placeholder="Present" value={exp.endDate} onChange={e => updateArrayItem('experience', exp.id, 'endDate', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Description / Impact</label>
                        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={e => updateArrayItem('experience', exp.id, 'description', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addArrayItem('experience', { company: "", role: "", startDate: "", endDate: "", description: "" })} className="w-full py-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Experience
                </button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-8 fade-in">
                {data.education.map((edu, index) => (
                  <div key={edu.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl relative shadow-sm transition-all hover:shadow-md">
                    <button onClick={() => removeArrayItem('education', edu.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Education #{index + 1}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Institution Name</label>
                        <input className={inputClass} placeholder="University / College" value={edu.institution} onChange={e => updateArrayItem('education', edu.id, 'institution', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Degree / Certification</label>
                        <input className={inputClass} placeholder="B.S. Design" value={edu.degree} onChange={e => updateArrayItem('education', edu.id, 'degree', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Year of Graduation</label>
                        <input className={inputClass} placeholder="2024" value={edu.year} onChange={e => updateArrayItem('education', edu.id, 'year', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addArrayItem('education', { institution: "", degree: "", year: "" })} className="w-full py-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Education
                </button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8 fade-in">
                <div>
                  <label className={labelClass}>Add a Professional Skill</label>
                  <form onSubmit={e => { e.preventDefault(); const v = e.target.skill.value; addSkill(v); e.target.skill.value = ""; }}>
                    <div className="flex gap-3">
                      <input name="skill" className={inputClass} placeholder="e.g. Graphic Design" />
                      <button type="submit" className="px-6 py-3 bg-slate-800 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-blue-700 transition-colors">Add</button>
                    </div>
                  </form>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-6">
                  {data.skills.map(skill => (
                    <span key={skill} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-full font-medium flex items-center gap-2 shadow-sm">
                      {skill} 
                      <button onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-8 fade-in">
                {data.projects.map((proj, index) => (
                  <div key={proj.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl relative shadow-sm transition-all hover:shadow-md">
                    <button onClick={() => removeArrayItem('projects', proj.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Project #{index + 1}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Project Title</label>
                        <input className={inputClass} placeholder="e.g. Rebranding Campaign" value={proj.title} onChange={e => updateArrayItem('projects', proj.id, 'title', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Link (Optional)</label>
                        <input className={inputClass} placeholder="https://..." value={proj.link} onChange={e => updateArrayItem('projects', proj.id, 'link', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Project Description</label>
                        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Describe what you built, designed, or achieved..." value={proj.description} onChange={e => updateArrayItem('projects', proj.id, 'description', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addArrayItem('projects', { title: "", link: "", description: "" })} className="w-full py-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Sidebar */}
        <div className="w-2/3 bg-slate-100 dark:bg-[#0a0a0a] p-10 overflow-y-auto flex justify-center pb-32 custom-scrollbar">
          <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm ring-1 ring-slate-900/5 dark:ring-white/10" style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div ref={printRef} style={{ width: '100%', height: '100%', minHeight: '297mm', backgroundColor: '#fff', position: 'relative' }}>
              {(() => {
                if (selectedTemplateId.startsWith('gen-')) {
                  const parts = selectedTemplateId.split('-');
                  const type = parts[1];
                  const num = parts[2];
                  const ComponentName = type === 'creator' ? `CreatorTemplate${num}` : `BrandTemplate${num}`;
                  const TemplateComponent = Generated[ComponentName];
                  return TemplateComponent ? <TemplateComponent data={data} /> : null;
                }
                switch(selectedTemplateId) {
                  case "creator-1": return <CreatorTemplateOne data={data} />;
                  case "creator-2": return <CreatorTemplateTwo data={data} />;
                  case "creator-3": return <CreatorTemplateThree data={data} />;
                  case "creator-4": return <CreatorTemplateFour data={data} />;
                  case "brand-1": return <BrandTemplateOne data={data} />;
                  case "brand-2": return <BrandTemplateTwo data={data} />;
                  case "brand-3": return <BrandTemplateThree data={data} />;
                  case "brand-4": return <BrandTemplateFour data={data} />;
                  default: return null;
                }
              })()}
              
              {/* Universal Watermark */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '25px',
                opacity: 0.08,
                fontFamily: '"Outfit", sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '3px',
                color: '#000',
                pointerEvents: 'none',
                zIndex: 9999
              }}>
                PACTOGRAM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
