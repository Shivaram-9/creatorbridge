export default function CreatorTemplateFour({ data }) {
  return (
    <div className="p-12 font-serif text-slate-800 dark:text-white bg-stone-50 min-h-[297mm] border-[12px] border-stone-200">
      <header className="text-center mb-12 pb-12 border-b border-stone-300">
        <h1 className="text-5xl font-normal tracking-widest uppercase text-stone-900 mb-4">{data.personal.name || "YOUR NAME"}</h1>
        <h2 className="text-lg font-light tracking-[0.2em] uppercase text-stone-500 mb-8">{data.personal.title || "Profession"}</h2>
        <div className="flex justify-center gap-6 text-xs uppercase tracking-wider text-stone-600 font-medium">
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.location && <span>{data.personal.location}</span>}
        </div>
      </header>

      {data.personal.summary && (
        <section className="mb-14 max-w-4xl mx-auto text-center">
          <p className="text-lg leading-relaxed text-stone-700 italic">
            "{data.personal.summary}"
          </p>
        </section>
      )}

      <div className="max-w-4xl mx-auto space-y-14">
        {data.experience.length > 0 && (
          <section>
            <h3 className="text-center text-sm font-bold tracking-[0.3em] uppercase text-stone-400 mb-10">Professional Experience</h3>
            <div className="space-y-10">
              {data.experience.map(exp => (
                <div key={exp.id} className="text-center">
                  <h4 className="text-xl font-bold text-stone-800 mb-1">{exp.role}</h4>
                  <p className="text-md text-stone-600 italic mb-2">{exp.company} | {exp.startDate} - {exp.endDate || 'Present'}</p>
                  <p className="text-sm leading-relaxed text-stone-600 max-w-2xl mx-auto">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects.length > 0 && (
          <section>
            <h3 className="text-center text-sm font-bold tracking-[0.3em] uppercase text-stone-400 mb-10">Selected Works</h3>
            <div className="grid grid-cols-2 gap-8">
              {data.projects.map(proj => (
                <div key={proj.id} className="text-center border border-stone-200 p-6 bg-white">
                  <h4 className="text-md font-bold text-stone-800 mb-2">{proj.title}</h4>
                  <p className="text-xs leading-relaxed text-stone-600 mb-3">{proj.description}</p>
                  {proj.link && <span className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-900 pb-1">{proj.link}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-12 pt-10 border-t border-stone-300">
          {data.skills.length > 0 && (
            <section className="text-center">
              <h3 className="text-sm font-bold tracking-[0.3em] uppercase text-stone-400 mb-6">Competencies</h3>
              <p className="text-sm leading-loose text-stone-700 uppercase tracking-wider">
                {data.skills.join(' • ')}
              </p>
            </section>
          )}

          {data.education.length > 0 && (
            <section className="text-center">
              <h3 className="text-sm font-bold tracking-[0.3em] uppercase text-stone-400 mb-6">Education</h3>
              <div className="space-y-4">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <p className="font-bold text-stone-800 uppercase tracking-wider text-sm">{edu.degree}</p>
                    <p className="text-stone-600 text-sm italic my-1">{edu.institution}</p>
                    <p className="text-stone-400 text-xs tracking-widest">{edu.year}</p>
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
