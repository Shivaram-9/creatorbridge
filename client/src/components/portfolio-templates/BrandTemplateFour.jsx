export default function BrandTemplateFour({ data }) {
  return (
    <div className="p-0 font-serif text-slate-800 bg-white min-h-[297mm]">
      {/* Elegant Header */}
      <div className="p-16 pb-12 text-center bg-slate-50 border-b border-slate-200">
        <h1 className="text-5xl font-semibold tracking-wide text-slate-900 mb-4">{data.personal.name || "Brand Name"}</h1>
        <div className="w-16 h-1 bg-amber-500 mx-auto mb-6"></div>
        <h2 className="text-lg text-slate-500 tracking-widest uppercase mb-8">{data.personal.title || "Brand Category"}</h2>
        <div className="flex justify-center gap-8 text-xs font-sans font-semibold text-slate-500 tracking-wider">
          {data.personal.website && <span className="uppercase">{data.personal.website}</span>}
          {data.personal.email && <span className="uppercase">{data.personal.email}</span>}
          {data.personal.phone && <span className="uppercase">{data.personal.phone}</span>}
        </div>
      </div>

      <div className="p-16 max-w-5xl mx-auto space-y-16">
        {data.personal.summary && (
          <section className="text-center">
            <p className="text-2xl leading-relaxed text-slate-700 italic font-light">
              "{data.personal.summary}"
            </p>
          </section>
        )}

        {data.skills.length > 0 && (
          <section className="text-center">
            <h3 className="text-sm font-sans font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 border-b border-slate-200 pb-4 inline-block">Brand Pillars</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {data.skills.map(skill => (
                <span key={skill} className="px-6 py-2 border border-slate-300 text-slate-700 font-sans text-xs uppercase tracking-widest rounded-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-16">
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-sm font-sans font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 border-b border-slate-200 pb-4">Brand Journey</h3>
              <div className="space-y-10">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <h4 className="text-xl font-semibold text-slate-900 mb-1">{exp.role}</h4>
                    <p className="text-sm font-sans text-amber-600 font-semibold mb-3 uppercase tracking-wider">{exp.company} <span className="text-slate-400 font-normal ml-2">({exp.startDate} - {exp.endDate || 'Present'})</span></p>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h3 className="text-sm font-sans font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 border-b border-slate-200 pb-4">Major Campaigns</h3>
              <div className="space-y-10">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">{proj.title}</h4>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap mb-3">{proj.description}</p>
                    {proj.link && <a href={proj.link} className="text-xs font-sans font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700">{proj.link}</a>}
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
