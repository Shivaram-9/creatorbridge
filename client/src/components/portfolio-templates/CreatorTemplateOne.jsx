export default function CreatorTemplateOne({ data }) {
  return (
    <div className="p-12 font-sans text-slate-800 bg-white" style={{ minHeight: '100%' }}>
      {/* Header */}
      <header className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-slate-900 mb-2 uppercase tracking-tight">{data.personal.name || "YOUR NAME"}</h1>
          <h2 className="text-2xl font-semibold text-blue-600 tracking-wider">{data.personal.title || "Creative Professional"}</h2>
        </div>
        <div className="text-right text-sm text-slate-500 space-y-1">
          {data.personal.email && <p>{data.personal.email}</p>}
          {data.personal.phone && <p>{data.personal.phone}</p>}
          {data.personal.location && <p>{data.personal.location}</p>}
          {data.personal.website && <p className="text-blue-600">{data.personal.website}</p>}
        </div>
      </header>

      {/* Summary */}
      {data.personal.summary && (
        <section className="mb-10">
          <p className="text-lg leading-relaxed text-slate-700 italic border-l-4 border-blue-200 pl-4">
            {data.personal.summary}
          </p>
        </section>
      )}

      <div className="flex gap-12">
        {/* Main Content (Left, 2/3) */}
        <div className="w-2/3 space-y-10">
          {/* Experience */}
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-xl font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-6">Experience</h3>
              <div className="space-y-6">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                      <span className="text-sm font-semibold text-blue-600">{exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ''}</span>
                    </div>
                    <h5 className="text-md font-medium text-slate-500 mb-2">{exp.company}</h5>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <section>
              <h3 className="text-xl font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-6">Key Projects</h3>
              <div className="space-y-6">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{proj.title}</h4>
                    {proj.link && <p className="text-sm text-blue-600 mb-2">{proj.link}</p>}
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar (Right, 1/3) */}
        <div className="w-1/3 space-y-10">
          {/* Skills */}
          {data.skills.length > 0 && (
            <section>
              <h3 className="text-xl font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-6">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <section>
              <h3 className="text-xl font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-6">Education</h3>
              <div className="space-y-4">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <h4 className="text-md font-bold text-slate-800">{edu.degree}</h4>
                    <p className="text-sm text-slate-500">{edu.institution}</p>
                    <p className="text-xs font-semibold text-blue-600 mt-1">{edu.year}</p>
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
