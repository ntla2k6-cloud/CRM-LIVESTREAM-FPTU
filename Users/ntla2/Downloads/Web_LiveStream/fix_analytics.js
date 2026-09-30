const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/analytics/page.tsx', 'utf8');

code = code.replace(
  '<div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">',
  '<div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto flex flex-col min-h-[500px]"><div className="min-w-[900px] flex-1 flex flex-col">'
);

code = code.replace(
  '                  ))}\n                </div>\n              </div>\n            )}',
  '                  ))}\n                </div></div>\n              </div>\n            )}'
);
code = code.replace(
  '                  ))}\r\n                </div>\r\n              </div>\r\n            )}',
  '                  ))}\r\n                </div></div>\r\n              </div>\r\n            )}'
);

fs.writeFileSync('frontend/src/app/analytics/page.tsx', code, 'utf8');
