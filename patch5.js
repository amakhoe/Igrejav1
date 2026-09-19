const fs = require('fs');
let content = fs.readFileSync('components/FinancesTab.tsx', 'utf8');

const target = `          </div>
          {groupedArray.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 p-4 font-bold text-gray-900 grid grid-cols-5 print:grid-cols-4 items-center">
              <div className="col-span-3 text-right pr-4">Total Geral do Período:</div>
              <div className="text-right text-emerald-700 text-lg">
                {groupedArray.reduce((sum, g) => sum + g.total, 0).toFixed(2)} MT
              </div>
              <div className="print:hidden"></div>
            </div>
          )}
        )}
      </div>`;

const replacement = `            {groupedArray.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 p-4 font-bold text-gray-900 grid grid-cols-5 print:grid-cols-4 items-center">
                <div className="col-span-3 text-right pr-4">Total Geral do Período:</div>
                <div className="text-right text-emerald-700 text-lg">
                  {groupedArray.reduce((sum, g) => sum + g.total, 0).toFixed(2)} MT
                </div>
                <div className="print:hidden"></div>
              </div>
            )}
          </div>
        )}
      </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('components/FinancesTab.tsx', content);
