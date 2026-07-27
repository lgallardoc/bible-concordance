const axios = require('axios');

(async () => {
  try {
    const url = 'https://mrk214.github.io/bible-data-es-spa/data/es___spa___spa/LBLA_vid_89.json';
    const response = await axios.get(url, {
      timeout: 60000,
      responseType: 'json',
    });
    
    const data = response.data;
    console.log('📊 Estructura de books[0]:');
    console.log('Claves en books[0]:', Object.keys(data.books[0]));
    
    console.log('\n📊 Estructura de books[0].chapters[0]:');
    console.log('Claves:', Object.keys(data.books[0].chapters[0]));
    
    const chapter = data.books[0].chapters[0];
    console.log('\nPropiedades principales:');
    console.log('- chapter_usfm:', chapter.chapter_usfm);
    console.log('- is_chapter:', chapter.is_chapter);
    console.log('- current:', chapter.current);
    console.log('- next:', chapter.next);
    console.log('- chapter_html length:', chapter.chapter_html?.length || 'no hay');
    
    // Buscar un atributo alternativo para los versículos
    const chapterKeys = Object.keys(chapter);
    console.log('\nTodas las claves en chapter:', chapterKeys);
    
    // Ver si hay un atributo para los versículos
    if (chapter.chapter_html) {
      console.log('\nPrimeros 500 chars del chapter_html:');
      console.log(chapter.chapter_html.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
