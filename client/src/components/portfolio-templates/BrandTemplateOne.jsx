export default function BrandTemplateOne({ data }) {
  return (
    <div className="p-12 font-sans text-slate-800 bg-white" style={{ minHeight: '100%' }}>
      {/* Brand Header */}
      <header className="flex justify-between items-center border-b-2 border-slate-900 pb-8 mb-10">
        <div className="w-2/3">
          <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">{data.personal.name || "COMPANY NAME"}</h1>
          <h2 className="text-xl font-medium text-slate-600 uppercase tracking-widest">{data.personal.title || "Industry / Sector"}</h2>
        </div>
        <div className="w-1/3 text-right">
          <div className="bg-slate-900 text-white p-4 rounded-lg inline-block text-sm text-left">
            {data.personal.website && <p className="font-semibold">{data.personal.website}</p>}
            {data.personal.email && <p>{data.personal.email}</p>}
            {data.personal.phone && <p>{data.personal.phone}</p>}
            {data.personal.location && <p className="mt-2 text-slate-400">{data.personal.location}</p>}
          </div>
        </div>
      </header>

      {/* Brand Summary */}
      {data.personal.summary && (
        <section className="mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">About Us</h3>
          <p className="text-xl leading-relaxed text-slate-800 font-light">
            {data.personal.summary}
          </p>
        </section>
      )}

      {/* Services / Skills as grid */}
      {data.skills.length > 0 && (
        <section className="mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Core Competencies</h3>
          <div className="grid grid-cols-3 gap-4">
            {data.skills.map(skill => (
              <div key={skill} className="bg-slate-50 border border-slate-100 p-4 text-center rounded">
                <span className="font-semibold text-slate-800">{skill}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-10">
        {/* Experience / History */}
        <div className="w-1/2">
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Company History</h3>
              <div className="space-y-6">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-2">{exp.company} | {exp.startDate} - {exp.endDate || 'Present'}</p>
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Projects / Case Studies */}
        <div className="w-1/2">
          {data.projects.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Featured Projects</h3>
              <div className="space-y-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="bg-slate-50 p-5 rounded border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{proj.title}</h4>
                    {proj.link && <p className="text-sm text-blue-600 mb-2">{proj.link}</p>}
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{proj.description}</p>
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
