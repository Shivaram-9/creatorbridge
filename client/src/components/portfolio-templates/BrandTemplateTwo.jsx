export default function BrandTemplateTwo({ data }) {
  return (
    <div className="p-0 font-sans text-slate-800 dark:text-white bg-slate-100 min-h-[297mm]">
      {/* Top Hero Banner */}
      <div className="bg-indigo-900 text-white p-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">{data.personal.name || "Brand Name"}</h1>
        <h2 className="text-xl font-medium text-indigo-200">{data.personal.title || "Brand Tagline or Category"}</h2>
      </div>

      <div className="p-12 space-y-12 bg-white m-8 shadow-sm rounded-lg min-h-[800px]">
        {/* Contact Strip */}
        <div className="flex justify-center flex-wrap gap-8 text-sm font-semibold text-slate-500 border-b border-slate-200 pb-8">
          {data.personal.email && <span>📧 {data.personal.email}</span>}
          {data.personal.phone && <span>📱 {data.personal.phone}</span>}
          {data.personal.location && <span>📍 {data.personal.location}</span>}
          {data.personal.website && <span>🌐 {data.personal.website}</span>}
        </div>

        {/* Executive Summary */}
        {data.personal.summary && (
          <section className="text-center max-w-3xl mx-auto">
            <h3 className="text-indigo-900 font-bold uppercase tracking-widest mb-4">Executive Summary</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              {data.personal.summary}
            </p>
          </section>
        )}

        {/* Services / Expertise */}
        {data.skills.length > 0 && (
          <section>
            <h3 className="text-indigo-900 font-bold uppercase tracking-widest mb-6 text-center">Areas of Expertise</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {data.skills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-medium border border-indigo-100">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200">
          {/* Track Record (Experience) */}
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-indigo-900 font-bold uppercase tracking-widest mb-6">Track Record</h3>
              <div className="space-y-6">
                {data.experience.map(exp => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-indigo-200">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{exp.company}</h4>
                    <p className="text-sm font-semibold text-indigo-600 mb-2">{exp.role} <span className="text-slate-400 font-normal ml-2">({exp.startDate} - {exp.endDate || 'Present'})</span></p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Initiatives (Projects) */}
          {data.projects.length > 0 && (
            <section>
              <h3 className="text-indigo-900 font-bold uppercase tracking-widest mb-6">Key Initiatives</h3>
              <div className="space-y-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="bg-slate-50 p-6 rounded border border-slate-200">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{proj.title}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{proj.description}</p>
                    {proj.link && <a href={proj.link} className="text-sm font-semibold text-indigo-600 inline-block border-b border-indigo-600 pb-1">View Initiative →</a>}
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
