const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

content = content.replace(
  '    const { default: jsPDF } = await import("jspdf");\n    const { default: jsPDF } = await import("jspdf");-autotable',
  '    const { default: jsPDF } = await import("jspdf");\n    const { default: autoTable } = await import("jspdf-autotable");'
);

fs.writeFileSync('components/FinancesTab.tsx', content);
