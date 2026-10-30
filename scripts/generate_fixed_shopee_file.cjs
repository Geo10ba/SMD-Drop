const XLSX = require('xlsx');

// 1. Read the error result file
const errorFilePath = 'c:/Users/Administrador/Desktop/Drop/public/planilhas de exemplo/Result_shopee_Shopee_mass_upload_20261030091104_basic_template.xlsx';
const wb = XLSX.readFile(errorFilePath);

const sheet = wb.Sheets['Modelo'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in Modelo:', data.length);

// Row 6 has our rejected product:
// Clear the error message in the last column (Col 51) and sanitize all image URLs (Cols 17, 18, 19, 20)
for (let r = 6; r < data.length; r++) {
  const row = data[r];
  if (!row || row.length === 0) continue;
  
  // Clean image columns: Col 7 (variation img), Col 14 (size chart img), Col 17 (cover), Cols 18..25 (other images)
  [7, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25].forEach(colIdx => {
    if (typeof row[colIdx] === 'string' && row[colIdx].trim()) {
      let u = row[colIdx].trim();
      if (u.includes('kwcdn.com') || u.includes('temu.com')) {
        u = u.replace(/\?imageView2.*$/i, '');
      }
      u = u.replace(/format\/(avif|webp)/gi, 'format/jpeg');
      row[colIdx] = u;
      console.log(`Row ${r} Col ${colIdx} clean image:`, u);
    }
  });

  // Clear failure reason column (last column)
  if (row.length > 51) {
    row[51] = '';
  }
}

// Write the fixed sheet back
const newSheet = XLSX.utils.aoa_to_sheet(data);
wb.Sheets['Modelo'] = newSheet;

const outputFilePath = 'c:/Users/Administrador/Desktop/Drop/public/planilhas de exemplo/Shopee_mass_upload_CORRIGIDA_pronta_para_subir.xlsx';
XLSX.writeFile(wb, outputFilePath);

console.log('Arquivo corrigido gerado com sucesso em:', outputFilePath);
