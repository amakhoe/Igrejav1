const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Replace standard import with dynamic import
content = content.replace(
  "import FinancesTab from '@/components/FinancesTab';",
  "import dynamic from 'next/dynamic';\nconst FinancesTab = dynamic(() => import('@/components/FinancesTab'), { ssr: false });"
);

fs.writeFileSync('app/page.tsx', content);
