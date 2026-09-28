(() => {
  'use strict';
  const encoder = new TextEncoder();
  const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
  const letters = index => {
    let result = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
      result = String.fromCharCode(65 + (n - 1) % 26) + result;
    return result;
  };
  const thaiDate = value => value ? new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value)) : '';
  const cell = (value, ref, heading) => {
    const style = heading ? ' s="1"' : '';
    if (typeof value === 'number' && Number.isFinite(value))
      return `<c r="${ref}"${style}><v>${value}</v></c>`;
    return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  };
  function sheet(headers, rows, widths) {
    if (rows.length >= 1048576) throw new Error('จำนวนแถวเกินขีดจำกัดของ Excel');
    const all = [headers, ...rows];
    const body = all.map((row, i) => `<row r="${i + 1}">${row.map((value, j) =>
      cell(value, `${letters(j)}${i + 1}`, i === 0)).join('')}</row>`).join('');
    const cols = widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${body}</sheetData>
  <autoFilter ref="A1:${letters(headers.length - 1)}${all.length}"/></worksheet>`;
  }
  const crcTable = Array.from({ length: 256 }, (_, i) => {
    let value = i;
    for (let j = 0; j < 8; j++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const parts = [], central = [];
    let offset = 0, centralSize = 0;
    for (const [name, content] of Object.entries(files)) {
      const nameBytes = encoder.encode(name), bytes = encoder.encode(content), checksum = crc32(bytes);
      const local = new Uint8Array(30 + nameBytes.length), a = new DataView(local.buffer);
      a.setUint32(0, 0x04034b50, true); a.setUint16(4, 20, true); a.setUint16(6, 0x0800, true);
      a.setUint32(14, checksum, true); a.setUint32(18, bytes.length, true);
      a.setUint32(22, bytes.length, true); a.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30); parts.push(local, bytes);
      const directory = new Uint8Array(46 + nameBytes.length), b = new DataView(directory.buffer);
      b.setUint32(0, 0x02014b50, true); b.setUint16(4, 20, true); b.setUint16(6, 20, true);
      b.setUint16(8, 0x0800, true); b.setUint32(16, checksum, true);
      b.setUint32(20, bytes.length, true); b.setUint32(24, bytes.length, true);
      b.setUint16(28, nameBytes.length, true); b.setUint32(42, offset, true);
      directory.set(nameBytes, 46); central.push(directory);
      offset += local.length + bytes.length; centralSize += directory.length;
    }
    const end = new Uint8Array(22), view = new DataView(end.buffer);
    view.setUint32(0, 0x06054b50, true); view.setUint16(8, central.length, true);
    view.setUint16(10, central.length, true); view.setUint32(12, centralSize, true);
    view.setUint32(16, offset, true);
    const output = new Uint8Array(offset + centralSize + end.length);
    let position = 0;
    for (const part of [...parts, ...central, end]) { output.set(part, position); position += part.length; }
    return output;
  }
  function build({ registrations, runners, beneficiaries }) {
    const registrationsById = new Map(registrations.map(row => [row.id, row]));
    const runnersById = new Map(runners.map(row => [row.id, row]));
    if (runners.some(row => !registrationsById.has(row.registration_id)) ||
        beneficiaries.some(row => !runnersById.has(row.runner_id)))
      throw new Error('ข้อมูลผู้แข่งขันหรือผู้รับผลประโยชน์ไม่ครบ กรุณาลองส่งออกอีกครั้ง');
    const runnerSort = (a, b) => registrationsById.get(a.registration_id).registration_code.localeCompare(
      registrationsById.get(b.registration_id).registration_code) || a.runner_no - b.runner_no;
    const sortedRunners = [...runners].sort(runnerSort);
    const runnerHeaders = ['รหัสสมัคร','วันเวลาสมัคร (ไทย)','สถานะใบสมัคร','รหัสแพ็กเกจ','ชื่อแพ็กเกจ',
      'ราคาแพ็กเกจ (บาท)','แผนชำระ','ภาษาที่สมัคร','วันที่ยินยอมข้อมูล (ไทย)','ลำดับผู้แข่งขัน',
      'คำนำหน้า','ชื่อ','นามสกุล','เลขบัตร/Passport','ที่อยู่','เบอร์โทร','เบอร์โทรฉุกเฉิน',
      'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน','กรุ๊ปเลือด','ไซส์เสื้อ'];
    const runnerRows = sortedRunners.map(runner => {
      const reg = registrationsById.get(runner.registration_id);
      return [reg.registration_code, thaiDate(reg.submitted_at), reg.status, reg.package_code,
        reg.package_name_snapshot, reg.package_price_thb, reg.payment_plan, reg.language,
        thaiDate(reg.consent_privacy_at), runner.runner_no, runner.prefix, runner.first_name,
        runner.last_name, runner.id_document, runner.address, runner.phone, runner.emergency_phone,
        runner.emergency_relation, runner.blood_group, runner.shirt_size];
    });
    const beneficiaryHeaders = ['รหัสสมัคร','ลำดับผู้แข่งขัน','ชื่อผู้แข่งขัน','เลขบัตร/Passport ผู้แข่งขัน',
      'ชื่อผู้รับผลประโยชน์','เลขบัตร/Passport ผู้รับผลประโยชน์','ความสัมพันธ์','สัดส่วน (%)'];
    const beneficiaryRows = [...beneficiaries].sort((a, b) => runnerSort(
      runnersById.get(a.runner_id), runnersById.get(b.runner_id)) || a.full_name.localeCompare(b.full_name))
      .map(person => {
        const runner = runnersById.get(person.runner_id), reg = registrationsById.get(runner.registration_id);
        return [reg.registration_code, runner.runner_no, `${runner.prefix || ''} ${runner.first_name} ${runner.last_name}`.trim(),
          runner.id_document, person.full_name, person.id_document, person.relationship, Number(person.percentage)];
      });
    const files = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="ผู้แข่งขัน" sheetId="1" r:id="rId1"/><sheet name="ผู้รับผลประโยชน์" sheetId="2" r:id="rId2"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      'xl/worksheets/sheet1.xml': sheet(runnerHeaders, runnerRows,
        runnerHeaders.map((_, i) => i === 14 ? 48 : [4, 11, 12, 13, 16, 17].includes(i) ? 30 : 23)),
      'xl/worksheets/sheet2.xml': sheet(beneficiaryHeaders, beneficiaryRows,
        beneficiaryHeaders.map((_, i) => [3, 5].includes(i) ? 36 : 28)),
    };
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { bytes: zip(files), filename: `RRIH-runners-${today}.xlsx`,
      runnerCount: runnerRows.length, beneficiaryCount: beneficiaryRows.length };
  }
  window.RRIHExport = { build };
})();
