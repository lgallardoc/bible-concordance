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
    
    console.log('📊 Analizando chapter.items:');
    console.log('Type:', typeof chapter.items);
    console.log('Is Array:', Array.isArray(chapter.items));
    
    if (Array.isArray(chapter.items)) {
      console.log('Length:', chapter.items.length);
      console.log('\nPrimeros 3 items:');
      for (let i = 0; i < Math.min(3, chapter.items.length); i++) {
        const item = chapter.items[i];
        console.log(`\n  Item ${i}:`);
        console.log('    Type:', item.type);
        console.log('    Keys:', Object.keys(item));
        if (item.type === 'verse') {
          console.log('    usfm:', item.usfm);
          console.log('    number:', item.number);
          console.log('    text:', item.text?.substring(0, 100) || 'N/A');
        }
      }
    } else if (typeof chapter.items === 'object') {
      console.log('Claves:', Object.keys(chapter.items).slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
