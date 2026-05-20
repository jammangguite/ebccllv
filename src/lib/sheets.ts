// Google Sheets Direct API Integration (Sheets API v4)
export const COLS = [
  'id', 'mid', 'bial', 'title', 'name', 'phone', 'dob', 'pob',
  'parents', 'baptDate', 'baptMode', 'tang', 'mtype', 'ordained',
  'rel', 'wed', 'kitenni', 'kitennamun', 'kite', 'wm', 'wf',
  'trans', 'death', 'addr', 'thil', 'updatedAt'
];

export async function getSheetGridId(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'EBCC_Members'
): Promise<number | null> {
  try {
    const resInfo = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!resInfo.ok) return null;
    const info = await resInfo.json();
    const found = (info.sheets || []).find((s: any) => s.properties?.title === sheetName);
    return found ? found.properties.sheetId : null;
  } catch (err) {
    console.error('Error fetching sheetGridId:', err);
    return null;
  }
}

export async function ensureTabAndHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'EBCC_Members'
): Promise<void> {
  const resInfo = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!resInfo.ok) {
    const err = await resInfo.json();
    throw new Error(err.error?.message || 'Failed to fetch spreadsheet info');
  }
  const info = await resInfo.json();
  const existingSheets = info.sheets || [];
  const tabExists = existingSheets.some((s: any) => s.properties?.title === sheetName);

  if (!tabExists) {
    // Create the sheet tab
    const resAdd = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: { title: sheetName }
              }
            }
          ]
        })
      });
    if (!resAdd.ok) {
      const err = await resAdd.json();
      throw new Error(err.error?.message || 'Failed to create sheet tab');
    }
  }

  // Now, check/write headers to row 1
  const resRead = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:Z1')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  let needsHeaders = true;
  if (resRead.ok) {
    const vals = await resRead.json();
    if (vals.values && vals.values.length > 0) {
      needsHeaders = false; // Already has headings
    }
  }

  if (needsHeaders) {
    const resWrite = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:Z1')}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${sheetName}!A1:Z1`,
          majorDimension: 'ROWS',
          values: [COLS]
        })
      }
    );
    if (!resWrite.ok) {
      const err = await resWrite.json();
      throw new Error(err.error?.message || 'Failed to initialize sheet headers');
    }
  }
}

export async function pullSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'EBCC_Members'
): Promise<any[]> {
  await ensureTabAndHeaders(accessToken, spreadsheetId, sheetName);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:Z5000')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to read sheet data');
  }
  const data = await res.json();
  const values = data.values;
  if (!values || values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1).map((r: any) => {
    const rowObj: any = {};
    headers.forEach((h: string, i: number) => {
      rowObj[h] = r[i] !== undefined ? String(r[i]).trim() : '';
    });
    return rowObj;
  }).filter((r: any) => r.id);

  return rows;
}

export async function upsertMemberToSheet(
  accessToken: string,
  spreadsheetId: string,
  member: any,
  sheetName: string = 'EBCC_Members'
): Promise<void> {
  await ensureTabAndHeaders(accessToken, spreadsheetId, sheetName);

  // Fetch current rows to find if we're doing an update or an append
  const resRead = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:A5000')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!resRead.ok) {
    const err = await resRead.json();
    throw new Error('Failed to find matching rows in sheet: ' + (err.error?.message || ''));
  }

  const data = await resRead.json();
  const ids = (data.values || []).map((row: any) => row[0]);
  const existingIdx = ids.indexOf(member.id); // index in list (0-based)

  const rowValues = COLS.map(c => member[c] !== undefined ? String(member[c]) : '');

  if (existingIdx !== -1) {
    // Row numbers are 1-indexed. The match at existingIdx corresponds to index existingIdx+1
    const rowNum = existingIdx + 1;
    const range = `${sheetName}!A${rowNum}:Z${rowNum}`;

    const resUpdate = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [rowValues]
        })
      }
    );
    if (!resUpdate.ok) {
      const err = await resUpdate.json();
      throw new Error('Failed to update member row: ' + (err.error?.message || ''));
    }
  } else {
    // Append
    const range = `${sheetName}!A1`;
    const resAppend = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [rowValues]
        })
      }
    );
    if (!resAppend.ok) {
      const err = await resAppend.json();
      throw new Error('Failed to append member row: ' + (err.error?.message || ''));
    }
  }
}

export async function deleteMemberFromSheet(
  accessToken: string,
  spreadsheetId: string,
  memberId: string,
  sheetName: string = 'EBCC_Members'
): Promise<void> {
  const sheetGridId = await getSheetGridId(accessToken, spreadsheetId, sheetName);
  if (sheetGridId === null) {
    throw new Error('Could not find Sheet tab Grid ID to perform delete operations.');
  }

  const resRead = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:A5000')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!resRead.ok) return;

  const data = await resRead.json();
  const ids = (data.values || []).map((row: any) => row[0]);
  const idx = ids.indexOf(memberId);

  if (idx !== -1) {
    // spreadsheet index is 0-indexed close-open, we want to delete exactly idx value (idx is 0-indexed)
    const resDelete = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetGridId,
                  dimension: 'ROWS',
                  startIndex: idx,
                  endIndex: idx + 1
                }
              }
            }
          ]
        })
      }
    );
    if (!resDelete.ok) {
      const err = await resDelete.json();
      throw new Error('Failed to delete member row: ' + (err.error?.message || ''));
    }
  }
}

export async function batchSyncToSheet(
  accessToken: string,
  spreadsheetId: string,
  operations: any[],
  sheetName: string = 'EBCC_Members'
): Promise<void> {
  await ensureTabAndHeaders(accessToken, spreadsheetId, sheetName);

  for (const op of operations) {
    if (op.action === 'upsert' && op.member) {
      await upsertMemberToSheet(accessToken, spreadsheetId, op.member, sheetName);
    } else if (op.action === 'delete' && op.id) {
      await deleteMemberFromSheet(accessToken, spreadsheetId, op.id, sheetName);
    }
  }
}
