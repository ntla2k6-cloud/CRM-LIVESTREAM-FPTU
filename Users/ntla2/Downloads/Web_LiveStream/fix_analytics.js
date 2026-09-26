
const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/analytics/page.tsx', 'utf8');

const regex1 = /const liveSessions = apiSessions\.map\(\(s: any\) => \{[\s\S]*?rawData\n          \};\n        \}\);/;
const replacement1 = 
          const liveSessions = apiSessions.map((s) => ({
            id: s.id,
            name: s.title,
            date: s.date || 'Hôm nay',
            duration: '1h 30m',
            views: '0',
            comments: 0
          }));
;
content = content.replace(regex1, replacement1);

const regex2 = /\/\/ Update mock data when active session changes[\s\S]*?\}\, \[activeSession, sessions\]\);/;
const replacement2 = 
  // Update data when active session changes
  useEffect(() => {
    if (!activeSession) return;
    import('@/lib/api').then(({ api }) => {
      api.get('/dashboard/analytics/' + activeSession).then((res) => {
        const allComments = res?.data?.rawData?.comments || [];
        const mg = allComments.filter(c => c.intent === 'Tham gia Minigame').map(c => ({
          user: c.user,
          question: 'Minigame',
          answer: c.content,
          isCorrect: c.content.includes('1.C') || c.content.includes('A') || c.content.includes('B'),
          time: c.time
        }));
        const gen = allComments.filter(c => c.intent !== 'Tham gia Minigame').map(c => ({
          user: c.user,
          text: c.content,
          intent: c.intent,
          time: c.time
        }));
        setMinigameComments(mg);
        setGeneralComments(gen);
      });
    });
  }, [activeSession]);
;
content = content.replace(regex2, replacement2);

fs.writeFileSync('frontend/src/app/analytics/page.tsx', content, 'utf8');

