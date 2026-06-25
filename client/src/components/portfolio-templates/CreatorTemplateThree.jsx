export default function CreatorTemplateThree({ data }) {
  return (
    <div className="p-0 font-sans text-slate-900 bg-white min-h-[297mm]">
      {/* Top Graphic Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-12 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl font-black tracking-tight mb-2 uppercase">{data.personal.name || "Your Name"}</h1>
          <h2 className="text-2xl font-semibold text-teal-100 tracking-wide uppercase">{data.personal.title || "Profession"}</h2>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 right-12 w-32 h-32 bg-teal-900 opacity-20 rounded-full translate-y-1/2"></div>
      </div>

      <div className="flex gap-8 p-12">
        {/* Left Column (Main Content) */}
        <div className="w-2/3 space-y-10">
          {data.personal.summary && (
            <section>
              <h3 className="text-xl font-bold text-teal-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-6 h-1 bg-teal-500 inline-block"></span> Profile
              </h3>
              <p className="text-slate-700 leading-relaxed text-md font-medium">
                {data.personal.summary}
              </p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-teal-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-6 h-1 bg-teal-500 inline-block"></span> Experience
              </h3>
              <div className="space-y-8">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">{exp.startDate} - {exp.endDate || 'Present'}</span>
                    </div>
                    <p className="text-md font-semibold text-slate-600 mb-2">{exp.company}</p>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-teal-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-6 h-1 bg-teal-500 inline-block"></span> Selected Projects
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="border border-slate-200 p-4 rounded-lg shadow-sm border-t-4 border-t-teal-500">
                    <h4 className="text-md font-bold text-slate-800 mb-1">{proj.title}</h4>
                    {proj.link && <p className="text-xs text-blue-500 mb-2">{proj.link}</p>}
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit space-y-10">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm font-medium text-slate-700">
              {data.personal.email && <p className="flex items-center gap-2"><span>✉️</span> {data.personal.email}</p>}
              {data.personal.phone && <p className="flex items-center gap-2"><span>📞</span> {data.personal.phone}</p>}
              {data.personal.location && <p className="flex items-center gap-2"><span>📍</span> {data.personal.location}</p>}
              {data.personal.website && <p className="flex items-center gap-2 text-teal-600"><span>🔗</span> {data.personal.website}</p>}
            </div>
          </section>

          {data.skills.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-full shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Education</h3>
              <div className="space-y-4">
                {data.education.map(edu => (
                  <div key={edu.id} className="relative pl-4 border-l-2 border-teal-200">
                    <p className="font-bold text-slate-800 text-sm">{edu.degree}</p>
                    <p className="text-slate-600 text-xs my-1">{edu.institution}</p>
                    <p className="text-teal-600 text-xs font-semibold">{edu.year}</p>
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
