export default function CreatorTemplateTwo({ data }) {
  return (
    <div className="p-0 font-serif text-slate-800 bg-white flex" style={{ minHeight: '100%' }}>
      {/* Left Dark Sidebar */}
      <div className="w-1/3 bg-slate-900 text-white p-10 flex flex-col min-h-[297mm]">
        <div className="mb-12">
          <h1 className="text-4xl font-normal leading-tight mb-2">{data.personal.name || "Your Name"}</h1>
          <h2 className="text-lg text-slate-400 font-light tracking-wider uppercase">{data.personal.title || "Profession"}</h2>
        </div>

        <div className="space-y-10 flex-1">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-700 pb-2">Contact</h3>
            <div className="space-y-2 text-sm font-light text-slate-300">
              {data.personal.email && <p>{data.personal.email}</p>}
              {data.personal.phone && <p>{data.personal.phone}</p>}
              {data.personal.location && <p>{data.personal.location}</p>}
              {data.personal.website && <p className="text-blue-400">{data.personal.website}</p>}
            </div>
          </section>

          {data.skills.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-700 pb-2">Skills</h3>
              <ul className="space-y-2 text-sm font-light text-slate-300">
                {data.skills.map(skill => (
                  <li key={skill}>• {skill}</li>
                ))}
              </ul>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-700 pb-2">Education</h3>
              <div className="space-y-4 text-sm">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <p className="font-semibold text-white">{edu.degree}</p>
                    <p className="text-slate-400 font-light">{edu.institution}</p>
                    <p className="text-slate-500 text-xs mt-1">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-2/3 p-10 bg-slate-50">
        {data.personal.summary && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Profile</h3>
            <p className="text-slate-600 leading-relaxed">
              {data.personal.summary}
            </p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Experience</h3>
            <div className="space-y-8">
              {data.experience.map(exp => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute w-3 h-3 bg-slate-800 rounded-full -left-[7px] top-2"></div>
                  <h4 className="text-xl font-bold text-slate-800">{exp.role}</h4>
                  <div className="flex justify-between items-center mt-1 mb-3">
                    <span className="text-md font-medium text-slate-600">{exp.company}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{exp.startDate} - {exp.endDate || 'Present'}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects.length > 0 && (
          <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Projects</h3>
            <div className="grid grid-cols-1 gap-6">
              {data.projects.map(proj => (
                <div key={proj.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-800 mb-1">{proj.title}</h4>
                  {proj.link && <p className="text-xs text-blue-500 mb-3">{proj.link}</p>}
                  <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
