const axios = require('axios');

(async () => {
  try {
    const url = 'https://mrk214.github.io/bible-data-es-spa/data/es___spa___spa/LBLA_vid_89.json';
    const response = await axios.get(url, {
      timeout: 60000,
      responseType: 'json',
    });
    
    const data = response.data;
    const chapter = data.books[0].chapters[0];
    
    console.log('📊 Analizando items en detalle:');
    
    const verseItems = chapter.items.filter(i => i.type === 'verse');
    console.log(`Encontrados ${verseItems.length} items tipo verse\n`);
    
    for (let i = 0; i < Math.min(3, verseItems.length); i++) {
      const item = verseItems[i];
      console.log(`Verse Item ${i}:`);
      console.log('  verse_numbers:', item.verse_numbers);
      console.log('  lines type:', typeof item.lines);
      console.log('  lines is array:', Array.isArray(item.lines));
      if (Array.isArray(item.lines)) {
        console.log('  lines length:', item.lines.length);
        if (item.lines.length > 0) {
          console.log('  lines[0]:', JSON.stringify(item.lines[0]).substring(0, 150));
        }
      } else if (typeof item.lines === 'object') {
        console.log('  lines keys:', Object.keys(item.lines).slice(0, 5));
      }
      console.log();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
