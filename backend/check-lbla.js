const axios = require('axios');
const fs = require('fs');

(async () => {
  try {
    const url = 'https://mrk214.github.io/bible-data-es-spa/data/es___spa___spa/LBLA_vid_89.json';
    console.log('📡 Descargando LBLA...');
    const response = await axios.get(url, {
      timeout: 60000,
      responseType: 'json',
    });
    
    const data = response.data;
    console.log('📊 Estructura del JSON:');
    console.log('Tipo:', typeof data);
    console.log('Es Array:', Array.isArray(data));
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      console.log('Número de claves:', keys.length);
      console.log('Primeras 5 claves:', keys.slice(0, 5));
      
      for (let i = 0; i < Math.min(3, keys.length); i++) {
        const k = keys[i];
        const val = data[k];
        const isArray = Array.isArray(val);
        console.log(`  - ${k}: tipo=${typeof val}, isArray=${isArray}${isArray ? `, length=${val.length}` : ''}`);
      }
    }
    
    if (Array.isArray(data)) {
      console.log('Largo del array:', data.length);
      if (data.length > 0) {
        console.log('Primer elemento (primeras 200 chars):');
        console.log(JSON.stringify(data[0]).substring(0, 200));
      }
    }
    
    // Guardar un ejemplo pequeño para revisar
    fs.writeFileSync('/workspaces/bible-concordance/backend/lbla-sample.json', 
      JSON.stringify(data, null, 2).substring(0, 2000));
    console.log('\n✅ Muestra guardada en lbla-sample.json');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
