const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

// The first replacement we did was:
// 'const { default: jsPDF } = await import("jspdf");' -> '// removed jspdf'
// 'const { default: autoTable } = await import("jspdf-autotable");' -> '// removed jspdf-autotable'
// 'const doc = new jsPDF();' -> 'const doc = {} as any;'
// 'autoTable(doc, {' -> '// autoTable(doc, {'

// And for the second one, we replaced '      startY: 40,' with '//       startY: 40,' etc.
// But the replace for '    });' might have hit the first one!

// Let's just download the original generatePDF function and inject it back.
content = content.replace(/\/\/ removed jspdf/g, 'const { default: jsPDF } = await import("jspdf");');
content = content.replace(/\/\/ removed jspdf-autotable/g, 'const { default: autoTable } = await import("jspdf-autotable");');
content = content.replace(/const doc = \{\} as any;/g, 'const doc = new jsPDF();');
content = content.replace(/\/\/ autoTable\(doc, \{/g, 'autoTable(doc, {');
content = content.replace(/\/\/       startY: 40,/g, '      startY: 40,');
content = content.replace(/\/\/      head: \[\['Data', 'Culto', 'Total Dízimos', 'Total Ofertas', 'Total Arrecadado'\]\],/g, "      head: [['Data', 'Culto', 'Total Dízimos', 'Total Ofertas', 'Total Arrecadado']],");
content = content.replace(/\/\/      body: tableData,/g, '      body: tableData,');

// The messed up '});' is at line 64:
// `createdAt: Date.now()\n  //    });\n      \n      setShowModal(false);`
content = content.replace(/createdAt: Date\.now\(\)\s*\/\/    \}\);\s*setShowModal\(false\);/, 'createdAt: Date.now()\n      });\n      \n      setShowModal(false);');

// The autoTable closing might also be commented out
content = content.replace(/body: tableData,\n\s*\/\/    \}\);/, 'body: tableData,\n    });');

fs.writeFileSync('components/FinancesTab.tsx', content);
