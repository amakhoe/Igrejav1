const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

content = content.replace(
  '      startY: 40,',
  '//       startY: 40,'
);
content = content.replace(
  "      head: [['Data', 'Culto', 'Total Dízimos', 'Total Ofertas', 'Total Arrecadado']],",
  "//      head: [['Data', 'Culto', 'Total Dízimos', 'Total Ofertas', 'Total Arrecadado']],"
);
content = content.replace(
  '      body: tableData,',
  '//      body: tableData,'
);
content = content.replace(
  '    });',
  '//    });'
);

fs.writeFileSync('components/FinancesTab.tsx', content);
