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
import { 
  GripVertical, ImageIcon, StarIcon, MegaphoneIcon, FolderIcon, 
  ShoppingBagIcon, UsersIcon, MessageSquareIcon, FileTextIcon, TrophyIcon, 
  Edit2Icon, ChevronDownIcon, PlusIcon, EyeIcon, PlaySquareIcon, BarChart2Icon,
  GitMergeIcon, MapPinIcon
} from "lucide-react";

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
  experience: [], 
  education: [],  
  skills: [],     
  projects: [],   
  achievements: [] 
};

// Map sections to their icons and descriptions
const SECTION_CONFIG = [
  { id: 'personal', title: 'Hero Section', description: 'Introduce your brand with a cover image, logo and summary.', icon: ImageIcon, visible: true },
  { id: 'projects', title: 'Featured Projects', description: 'Showcase your best campaigns or projects.', icon: StarIcon, visible: true },
  { id: 'experience', title: 'Campaigns / Experience', description: 'Display all the campaigns you have executed.', icon: MegaphoneIcon, visible: true },
  { id: 'skills', title: 'Brand Assets / Skills', description: 'Share logos, product images, media kit and more.', icon: FolderIcon, visible: true },
  { id: 'products', title: 'Products / Services', description: 'Show your products or services.', icon: ShoppingBagIcon, visible: true },
  { id: 'education', title: 'Previous Collaborations', description: 'Show creators or brands you\'ve worked with.', icon: UsersIcon, visible: true },
  { id: 'testimonials', title: 'Testimonials', description: 'Add reviews or feedback from creators.', icon: MessageSquareIcon, visible: true },
  { id: 'media', title: 'Media / Press', description: 'Show features, mentions or media coverage.', icon: FileTextIcon, visible: false },
  { id: 'achievements', title: 'Achievements', description: 'Highlight awards, certifications and milestones.', icon: TrophyIcon, visible: false }
];

const SIDEBAR_WIDGETS = [
  { icon: ImageIcon, label: "Image Gallery" },
  { icon: PlaySquareIcon, label: "Video Showcase" },
  { icon: BarChart2Icon, label: "Stats / Impact" },
  { icon: GitMergeIcon, label: "Process" },
  { icon: UsersIcon, label: "Team" },
  { icon: MapPinIcon, label: "Locations" },
  { icon: PlaySquareIcon, label: "Client Logos" },
  { icon: FileTextIcon, label: "Custom Section" }
];

export default function PortfolioBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState(DEFAULT_DATA);
  const [templateType, setTemplateType] = useState(user?.role === "brand" ? "brand" : "creator");
  const [selectedTemplateId, setSelectedTemplateId] = useState("creator-1");
  const [sections, setSections] = useState(SECTION_CONFIG);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

  const toggleSectionVisibility = (id) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, visible: !sec.visible } : sec));
  };

  // Add more editing handlers as needed to wire up the actual modals later

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#121212] pt-16 font-sans">
      
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-8 py-8 flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/profile')} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-3 text-sm flex items-center gap-1 font-medium transition-colors">
            &larr; Back to Profile
          </button>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white">Portfolio Builder</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-[15px]">Build your brand portfolio to attract the right creators.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowPreviewModal(true)} 
            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 pb-16 flex gap-10 items-start">
        
        {/* Main Canvas (Sections List) */}
        <div className="flex-1">
          {/* Info Banner */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[13px] font-medium">
              <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-serif italic text-slate-400">i</span>
              Drag & drop sections to reorder. Add, edit or remove sections to build your perfect portfolio.
            </div>
            <button className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-[14px] p-5 flex items-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-grab active:cursor-grabbing mr-4">
                  <GripVertical className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mr-5">
                  <section.icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">{section.title}</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{section.description}</p>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <span className={`text-[13px] font-semibold tracking-wide ${section.visible ? 'text-green-600 dark:text-green-500' : 'text-slate-400'}`}>
                      {section.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button 
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors ${section.visible ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${section.visible ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-8">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-colors">
                      <Edit2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-colors">
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Section Button */}
          <button className="w-full mt-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[14px] p-6 flex items-center justify-center gap-4 text-slate-500 hover:bg-white dark:hover:bg-slate-800/50 hover:border-slate-300 transition-all text-left group bg-slate-50/50 dark:bg-[#1a1a1a]/50">
            <div className="flex flex-col items-center">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <PlusIcon className="w-4 h-4" /> Add New Section
              </div>
              <div className="text-[13px]">Choose from a variety of sections to enhance your portfolio.</div>
            </div>
          </button>
        </div>

        {/* Right Sidebar Toolbar */}
        <div className="w-[340px] shrink-0 space-y-8">
          
          {/* Add Sections Widget */}
          <div className="bg-transparent">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-[15px]">Add Sections</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">Choose sections and add to your portfolio.</p>
            
            <div className="grid grid-cols-3 gap-3">
              {SIDEBAR_WIDGETS.map((widget, i) => (
                <button key={i} className="flex flex-col items-center gap-3 p-3 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-slate-900">
                    <widget.icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
                    {widget.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />

          {/* Portfolio Templates Widget */}
          <div className="bg-transparent">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-[15px]">Portfolio Templates</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">Get started quickly with pre-built templates.</p>
            
            <div className="space-y-4">
              {/* Template Card 1 */}
              <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-4 group hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedTemplateId('brand-1')}>
                <div className="w-[84px] h-[100px] bg-slate-900 rounded-lg overflow-hidden relative shrink-0 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-80" />
                  <div className="absolute top-3 left-2 right-2 h-1 bg-slate-700 rounded-full" />
                  <div className="absolute top-5 left-2 w-10 h-1 bg-slate-700 rounded-full" />
                  <div className="absolute bottom-3 left-2 right-2 flex gap-1">
                    <div className="h-4 flex-1 bg-slate-700 rounded-sm" />
                    <div className="h-4 flex-1 bg-slate-700 rounded-sm" />
                    <div className="h-4 flex-1 bg-slate-700 rounded-sm" />
                  </div>
                </div>
                <div className="flex flex-col justify-center py-1">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Brand Showcase</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Perfect for brands to showcase campaigns and impact.</p>
                  </div>
                  <button className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 mt-3 w-max hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Use Template
                  </button>
                </div>
              </div>

              {/* Template Card 2 */}
              <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-4 group hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedTemplateId('brand-2')}>
                <div className="w-[84px] h-[100px] bg-white border border-slate-200 rounded-lg overflow-hidden relative shrink-0 shadow-inner">
                  <div className="absolute top-2 left-2 right-2 h-[28px] bg-slate-100 rounded-md" />
                  <div className="absolute top-[42px] left-2 right-2 flex gap-1">
                    <div className="h-[20px] w-4 bg-slate-200 rounded-sm" />
                    <div className="h-[20px] flex-1 bg-slate-100 rounded-sm" />
                  </div>
                </div>
                <div className="flex flex-col justify-center py-1">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Product Focused</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Ideal for product based brands and D2C businesses.</p>
                  </div>
                  <button className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 mt-3 w-max hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Use Template
                  </button>
                </div>
              </div>

              {/* Template Card 3 */}
              <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-4 group hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedTemplateId('brand-3')}>
                <div className="w-[84px] h-[100px] bg-blue-900 rounded-lg overflow-hidden relative shrink-0 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-indigo-800 opacity-90" />
                  <div className="absolute top-[40px] left-0 right-0 h-5 bg-white/10 backdrop-blur-sm" />
                </div>
                <div className="flex flex-col justify-center py-1">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Agency Profile</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Great for agencies to highlight services and work.</p>
                  </div>
                  <button className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 mt-3 w-max hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-100 dark:bg-[#121212] w-full max-w-[1200px] h-[90vh] rounded-[24px] overflow-hidden flex flex-col relative shadow-2xl border border-slate-200/50 dark:border-slate-800">
            {/* Modal Header */}
            <div className="bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <EyeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-[15px] dark:text-white leading-none">Live Preview</h2>
                  <p className="text-[11px] text-slate-500 mt-1 leading-none">This is how your portfolio will look when exported.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadPdf}
                  disabled={generating}
                  className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {generating ? 'Exporting...' : 'Export PDF'}
                </button>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ml-2"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Modal Body - The A4 Canvas */}
            <div className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar">
              <div className="bg-white shadow-2xl origin-top transition-transform" style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box', overflow: 'hidden' }}>
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
      )}

    </div>
  );
}
