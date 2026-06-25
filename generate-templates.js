const fs = require('fs');
const path = require('path');

const colors = ['blue', 'indigo', 'teal', 'emerald', 'rose', 'amber', 'slate', 'stone', 'violet', 'cyan'];
const fonts = ['font-sans', 'font-serif', 'font-mono'];
const bgColors = ['bg-white', 'bg-slate-50', 'bg-stone-50', 'bg-zinc-50'];

function generateTemplateCode(role, index) {
  const color = colors[index % colors.length];
  const font = fonts[index % fonts.length];
  const bg = bgColors[index % bgColors.length];
  const name = `${role === 'creator' ? 'Creator' : 'Brand'}Template${index}`;

  // Vary layout based on index (even/odd)
  const isSplit = index % 2 === 0;

  return `export default function ${name}({ data }) {
  return (
    <div className="p-10 ${font} text-slate-800 ${bg} min-h-[297mm]">
      <header className="border-b-4 border-${color}-500 pb-6 mb-8 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-widest mb-2 text-${color}-900">{data.personal.name || "${role === 'creator' ? 'YOUR NAME' : 'BRAND NAME'}"}</h1>
        <h2 className="text-xl font-medium text-${color}-600">{data.personal.title || "Profession"}</h2>
        <div className="mt-4 flex justify-center gap-6 text-sm text-slate-500 font-semibold">
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.location && <span>{data.personal.location}</span>}
        </div>
      </header>

      {data.personal.summary && (
        <section className="mb-10 text-center max-w-3xl mx-auto">
          <p className="text-lg leading-relaxed text-slate-600 italic border-l-4 border-${color}-300 pl-4 text-left">
            {data.personal.summary}
          </p>
        </section>
      )}

      <div className="${isSplit ? 'flex gap-10' : 'space-y-10'}">
        <div className="${isSplit ? 'w-2/3 space-y-10' : 'space-y-10'}">
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-lg font-bold uppercase tracking-widest text-${color}-800 border-b-2 border-slate-200 pb-2 mb-6">Experience</h3>
              <div className="space-y-6">
                {data.experience.map(exp => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-${color}-200">
                    <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                    <p className="text-sm font-semibold text-${color}-600 mb-2">{exp.company} | {exp.startDate} - {exp.endDate || 'Present'}</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h3 className="text-lg font-bold uppercase tracking-widest text-${color}-800 border-b-2 border-slate-200 pb-2 mb-6">Projects</h3>
              <div className="grid grid-cols-${isSplit ? '1' : '2'} gap-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="p-4 border border-slate-200 rounded shadow-sm bg-white">
                    <h4 className="text-md font-bold text-slate-800 mb-1">{proj.title}</h4>
                    {proj.link && <p className="text-xs text-blue-500 mb-2">{proj.link}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="${isSplit ? 'w-1/3 space-y-10' : 'grid grid-cols-2 gap-10 pt-10 border-t border-slate-200'}">
          {data.skills.length > 0 && (
            <section>
              <h3 className="text-lg font-bold uppercase tracking-widest text-${color}-800 border-b-2 border-slate-200 pb-2 mb-6">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full border border-${color}-100">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h3 className="text-lg font-bold uppercase tracking-widest text-${color}-800 border-b-2 border-slate-200 pb-2 mb-6">Education</h3>
              <div className="space-y-4">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <p className="font-bold text-slate-800 text-sm">{edu.degree}</p>
                    <p className="text-slate-600 text-xs my-1">{edu.institution}</p>
                    <p className="text-${color}-600 text-xs font-semibold">{edu.year}</p>
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
`;
}

const dir = path.join(__dirname, 'client', 'src', 'components', 'portfolio-templates', 'generated');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let indexExports = '';

for (let i = 1; i <= 20; i++) {
  // Creator
  fs.writeFileSync(path.join(dir, `CreatorTemplate${i}.jsx`), generateTemplateCode('creator', i));
  indexExports += `export { default as CreatorTemplate${i} } from './CreatorTemplate${i}.jsx';\n`;
  
  // Brand
  fs.writeFileSync(path.join(dir, `BrandTemplate${i}.jsx`), generateTemplateCode('brand', i));
  indexExports += `export { default as BrandTemplate${i} } from './BrandTemplate${i}.jsx';\n`;
}

fs.writeFileSync(path.join(dir, 'index.js'), indexExports);
console.log('Successfully generated 40 templates');
