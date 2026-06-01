const SHEET_NAME = 'Pagina1';
const FIRST_DATA_ROW = 3;
const ADMIN_CODE = '1806';

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('A aba Pagina1 nao foi encontrada.');
  return sheet;
}

function normalizeCode_(value) {
  return String(value || '').trim().toUpperCase();
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function listStores_() {
  const sheet = getSheet_();
  const rowCount = Math.max(0, sheet.getLastRow() - FIRST_DATA_ROW + 1);
  if (!rowCount) return [];

  return sheet
    .getRange(FIRST_DATA_ROW, 1, rowCount, 3)
    .getValues()
    .map(function (row) {
      return {
        code: normalizeCode_(row[0]),
        name: String(row[1] || '').trim(),
        freight: String(row[2] || '').trim(),
      };
    })
    .filter(function (store) {
      return store.code && store.name;
    });
}

function findStore_(code) {
  const normalizedCode = normalizeCode_(code);
  return listStores_().find(function (store) {
    return store.code === normalizedCode;
  }) || null;
}

function saveStore_(code, name) {
  const normalizedCode = normalizeCode_(code);
  const normalizedName = String(name || '').trim();
  if (!/^\d{3,4}$/.test(normalizedCode)) throw new Error('Use um codigo numerico de 3 ou 4 digitos.');
  if (!normalizedName) throw new Error('Informe o nome da loja.');

  const sheet = getSheet_();
  const rowCount = Math.max(0, sheet.getLastRow() - FIRST_DATA_ROW + 1);
  const values = rowCount ? sheet.getRange(FIRST_DATA_ROW, 1, rowCount, 2).getValues() : [];
  const index = values.findIndex(function (row) {
    return normalizeCode_(row[0]) === normalizedCode;
  });
  const row = index >= 0 ? FIRST_DATA_ROW + index : Math.max(FIRST_DATA_ROW, sheet.getLastRow() + 1);

  sheet.getRange(row, 1, 1, 2).setValues([[normalizedCode, normalizedName]]);
  return { code: normalizedCode, name: normalizedName };
}

function deleteStore_(code) {
  const normalizedCode = normalizeCode_(code);
  if (normalizedCode === '1806') throw new Error('O acesso administrativo nao pode ser removido.');

  const sheet = getSheet_();
  const rowCount = Math.max(0, sheet.getLastRow() - FIRST_DATA_ROW + 1);
  if (!rowCount) return;

  const values = sheet.getRange(FIRST_DATA_ROW, 1, rowCount, 1).getValues();
  const index = values.findIndex(function (row) {
    return normalizeCode_(row[0]) === normalizedCode;
  });

  if (index >= 0) sheet.deleteRow(FIRST_DATA_ROW + index);
}

function doGet(event) {
  try {
    const params = event.parameter || {};
    if (params.action === 'list') {
      if (normalizeCode_(params.adminCode) !== ADMIN_CODE) throw new Error('Acesso nao autorizado.');
      return json_({ ok: true, stores: listStores_() });
    }
    if (params.action === 'validate') return json_({ ok: true, store: findStore_(params.code) });
    return json_({ ok: false, error: 'Operacao invalida.' });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    if (normalizeCode_(body.adminCode) !== ADMIN_CODE) throw new Error('Acesso nao autorizado.');
    if (body.action === 'save') return json_({ ok: true, store: saveStore_(body.code, body.name) });
    if (body.action === 'delete') {
      deleteStore_(body.code);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'Operacao invalida.' });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}
