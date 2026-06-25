export default function BrandTemplateThree({ data }) {
  return (
    <div className="p-0 font-sans text-slate-800 bg-white min-h-[297mm] flex flex-col">
      {/* Top Header - Geometric */}
      <header className="relative bg-white pt-16 px-16 pb-8 border-b-8 border-red-600">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-100 -z-10" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}></div>
        <div className="flex justify-between items-end">
          <div className="w-2/3">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2">{data.personal.name || "COMPANY"}</h1>
            <h2 className="text-xl font-bold text-red-600 uppercase tracking-widest">{data.personal.title || "Industry Sector"}</h2>
          </div>
          <div className="w-1/3 text-right text-sm font-semibold text-slate-500 space-y-1">
            {data.personal.email && <p>{data.personal.email}</p>}
            {data.personal.phone && <p>{data.personal.phone}</p>}
            {data.personal.location && <p>{data.personal.location}</p>}
            {data.personal.website && <p className="text-slate-900">{data.personal.website}</p>}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-slate-100 p-10 flex flex-col">
          {data.personal.summary && (
            <section className="mb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 border-red-200 pb-2">Company Overview</h3>
              <p className="text-sm leading-relaxed text-slate-700 font-medium">
                {data.personal.summary}
              </p>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 border-red-200 pb-2">Core Services</h3>
              <ul className="space-y-3">
                {data.skills.map(skill => (
                  <li key={skill} className="flex items-center text-sm font-bold text-slate-800">
                    <span className="w-2 h-2 bg-red-600 rounded-sm mr-3"></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Main Content */}
        <div className="w-2/3 p-10 bg-white">
          {data.experience.length > 0 && (
            <section className="mb-12">
              <h3 className="text-2xl font-black uppercase text-slate-900 mb-6 flex items-center">
                <span className="bg-slate-900 text-white px-3 py-1 text-sm mr-3">01</span> Our History
              </h3>
              <div className="space-y-8">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <h4 className="text-lg font-bold text-slate-800">{exp.company}</h4>
                    <p className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">{exp.role} <span className="text-slate-400 font-medium ml-2">| {exp.startDate} - {exp.endDate || 'Present'}</span></p>
                    <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h3 className="text-2xl font-black uppercase text-slate-900 mb-6 flex items-center">
                <span className="bg-slate-900 text-white px-3 py-1 text-sm mr-3">02</span> Case Studies
              </h3>
              <div className="space-y-8">
                {data.projects.map(proj => (
                  <div key={proj.id} className="border-l-4 border-red-600 pl-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{proj.title}</h4>
                    {proj.link && <p className="text-xs text-blue-600 mb-2">{proj.link}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
