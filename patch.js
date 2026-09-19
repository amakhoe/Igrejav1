const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');
const replacement = `      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dízimos e Ofertas (Por Culto)</h2>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <FileDown className="w-5 h-5" />
            Exportar (PDF)
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Registo
          </button>
        </div>
      </div>`;

content = content.replace(/<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>/, replacement);
fs.writeFileSync('components/FinancesTab.tsx', content);
