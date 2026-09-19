const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

// Remove the imports
content = content.replace(
  'const { default: jsPDF } = await import("jspdf");',
  '// removed jspdf'
);
content = content.replace(
  'const { default: autoTable } = await import("jspdf-autotable");',
  '// removed jspdf-autotable'
);

// We need to also disable the whole `generatePDF` function just in case
content = content.replace(
  'const generatePDF = async () => {',
  'const generatePDF = async () => { return; '
);

fs.writeFileSync('components/FinancesTab.tsx', content);
