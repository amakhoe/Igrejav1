const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

content = content.replace(
  /<td className="py-2 text-right">\s*<button/g,
  '<td className="py-2 text-right print:hidden">\n                                <button'
);

fs.writeFileSync('components/FinancesTab.tsx', content);
