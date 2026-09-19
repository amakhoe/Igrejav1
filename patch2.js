const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

// Replace Header Grid
content = content.replace(
  '<div className="grid grid-cols-5 bg-gray-50 text-gray-500 text-sm font-medium p-4 border-b border-gray-100">',
  '<div className="grid grid-cols-5 print:grid-cols-4 bg-gray-50 text-gray-500 text-sm font-medium p-4 border-b border-gray-100">'
);
content = content.replace(
  '<div className="text-right">Detalhes</div>',
  '<div className="text-right print:hidden">Detalhes</div>'
);

// Replace Row Grid
content = content.replace(
  '<div \n                  className="grid grid-cols-5 items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"',
  '<div \n                  className="grid grid-cols-5 print:grid-cols-4 items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"'
);

// Replace Row Action (Chevron)
content = content.replace(
  '<div className="text-right flex justify-end">',
  '<div className="text-right flex justify-end print:hidden">'
);

// Replace nested table 'Ação' Header
content = content.replace(
  '<th className="pb-2 font-medium text-right">Ação</th>',
  '<th className="pb-2 font-medium text-right print:hidden">Ação</th>'
);

// Replace nested table action cell
content = content.replace(
  '<td className="py-2 text-right">\\n                                <button',
  '<td className="py-2 text-right print:hidden">\\n                                <button'
);

fs.writeFileSync('components/FinancesTab.tsx', content);
