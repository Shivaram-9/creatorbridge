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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col pt-16">
      <div className="bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-[#262626] px-6 py-4 flex justify-between items-center sticky top-16 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-white">← Back</button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Portfolio Builder</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <select value={templateType} onChange={(e) => { setTemplateType(e.target.value); setSelectedTemplateId(e.target.value === "brand" ? "brand-1" : "creator-1"); }} className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="creator">Creator Templates</option>
            <option value="brand">Brand Templates</option>
          </select>
          
          <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            {templateType === "creator" ? (
              <>
                <option value="creator-1">Creative Professional</option>
                <option value="creator-2">Minimalist Modern</option>
                <option value="creator-3">Vibrant Portfolio</option>
                <option value="creator-4">Editorial Elegance</option>
                {CREATOR_LAYOUT_NAMES.map((name, i) => (
                  <option key={`c-${i+1}`} value={`gen-creator-${i+1}`}>{name}</option>
                ))}
              </>
            ) : (
              <>
                <option value="brand-1">Corporate Profile</option>
                <option value="brand-2">Agency Brief</option>
                <option value="brand-3">Bold Impact</option>
                <option value="brand-4">Classic Heritage</option>
                {BRAND_LAYOUT_NAMES.map((name, i) => (
                  <option key={`b-${i+1}`} value={`gen-brand-${i+1}`}>{name}</option>
                ))}
              </>
            )}
          </select>

          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={handleDownloadPdf} disabled={generating} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold">{generating ? "Generating..." : "Download PDF"}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <div className="w-1/3 bg-white dark:bg-[#171717] border-r border-slate-200 dark:border-[#262626] flex flex-col overflow-y-auto">
          <div className="flex border-b border-slate-200 dark:border-[#262626] flex-wrap">
            {['personal', 'experience', 'education', 'skills', 'projects'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-2 text-xs font-semibold capitalize tracking-wider ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-white'}`}>{tab}</button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Full Name" value={data.personal.name} onChange={e => updatePersonal('name', e.target.value)} />
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Professional Title" value={data.personal.title} onChange={e => updatePersonal('title', e.target.value)} />
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Email Address" value={data.personal.email} onChange={e => updatePersonal('email', e.target.value)} />
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Phone Number" value={data.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} />
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Location" value={data.personal.location} onChange={e => updatePersonal('location', e.target.value)} />
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Website / Portfolio URL" value={data.personal.website} onChange={e => updatePersonal('website', e.target.value)} />
                <textarea className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white min-h-[120px]" placeholder="Professional Summary" value={data.personal.summary} onChange={e => updatePersonal('summary', e.target.value)} />
              </div>
            )}
            
            {activeTab === 'experience' && (
              <div className="space-y-6">
                {data.experience.map(exp => (
                  <div key={exp.id} className="p-4 border rounded relative dark:border-slate-600">
                    <button onClick={() => removeArrayItem('experience', exp.id)} className="absolute top-2 right-2 text-red-500">✕</button>
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Company Name" value={exp.company} onChange={e => updateArrayItem('experience', exp.id, 'company', e.target.value)} />
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Role / Job Title" value={exp.role} onChange={e => updateArrayItem('experience', exp.id, 'role', e.target.value)} />
                    <div className="flex gap-2 mb-2">
                      <input className="w-1/2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Start Date" value={exp.startDate} onChange={e => updateArrayItem('experience', exp.id, 'startDate', e.target.value)} />
                      <input className="w-1/2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="End Date" value={exp.endDate} onChange={e => updateArrayItem('experience', exp.id, 'endDate', e.target.value)} />
                    </div>
                    <textarea className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white min-h-[80px]" placeholder="Description" value={exp.description} onChange={e => updateArrayItem('experience', exp.id, 'description', e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addArrayItem('experience', { company: "", role: "", startDate: "", endDate: "", description: "" })} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-700">+ Add Experience</button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                {data.education.map(edu => (
                  <div key={edu.id} className="p-4 border rounded relative dark:border-slate-600">
                    <button onClick={() => removeArrayItem('education', edu.id)} className="absolute top-2 right-2 text-red-500">✕</button>
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Institution Name" value={edu.institution} onChange={e => updateArrayItem('education', edu.id, 'institution', e.target.value)} />
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Degree / Certification" value={edu.degree} onChange={e => updateArrayItem('education', edu.id, 'degree', e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Year" value={edu.year} onChange={e => updateArrayItem('education', edu.id, 'year', e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addArrayItem('education', { institution: "", degree: "", year: "" })} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-700">+ Add Education</button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                <form onSubmit={e => { e.preventDefault(); const v = e.target.skill.value; addSkill(v); e.target.skill.value = ""; }}>
                  <div className="flex gap-2">
                    <input name="skill" className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Add a skill" />
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded">Add</button>
                  </div>
                </form>
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center gap-2 text-slate-800 dark:text-white">
                      {skill} <button onClick={() => removeSkill(skill)} className="text-red-500 font-bold hover:text-red-700">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="p-4 border rounded relative dark:border-slate-600">
                    <button onClick={() => removeArrayItem('projects', proj.id)} className="absolute top-2 right-2 text-red-500">✕</button>
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Project Title" value={proj.title} onChange={e => updateArrayItem('projects', proj.id, 'title', e.target.value)} />
                    <input className="w-full mb-2 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Link (Optional)" value={proj.link} onChange={e => updateArrayItem('projects', proj.id, 'link', e.target.value)} />
                    <textarea className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white min-h-[80px]" placeholder="Description" value={proj.description} onChange={e => updateArrayItem('projects', proj.id, 'description', e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addArrayItem('projects', { title: "", link: "", description: "" })} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-700">+ Add Project</button>
              </div>
            )}
          </div>
        </div>

        <div className="w-2/3 bg-slate-200 dark:bg-slate-900 p-8 overflow-y-auto flex justify-center pb-24">
          <div className="bg-white shadow-xl" style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
            <div ref={printRef} style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
