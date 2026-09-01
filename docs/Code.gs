const SHEET_ID = '1V1476ZgCyUd8q0DB-8rSp6mi_Q4PRHAwYbU8UoZEhSU';
const SHEET_GID = 1621616972;

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function targetSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheets().find((item) => item.getSheetId() === SHEET_GID);
  if (!sheet) throw new Error('gid ' + SHEET_GID + ' 탭을 찾을 수 없습니다.');
  return sheet;
}

function cellToText_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value == null ? '' : String(value);
}

// 관리자 모드가 이 시트를 실시간으로 읽을 수 있도록 A~N열(14개 컬럼) 데이터 행을 그대로 반환한다.
// 1행은 헤더로 보고 2행부터 반환한다.
function getRows_() {
  const sheet = targetSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 14).getValues().map(function (row) {
    return row.map(cellToText_);
  });
}

function doGet() {
  const sheet = targetSheet_();
  return json_({ ok: true, sheet: sheet.getName(), rows: getRows_() });
}

// 구글폼 "캠페인 신청" 제출 시 구글 내부에서 실행되는 트리거.
// 회사 네트워크가 script.google.com(웹앱 URL)을 차단해도, 폼 제출은 docs.google.com을 거치고
// 이 트리거는 구글 서버 안에서 바로 실행되므로 우리 사내망을 전혀 지나가지 않는다.
// 스프레드시트 Apps Script 편집기 > 좌측 시계 아이콘(트리거) > 트리거 추가에서
// 함수: onFormSubmit_ / 이벤트 소스: 스프레드시트에서 / 이벤트 유형: 양식 제출 시 로 등록해야 동작한다.
// 폼 질문 제목은 아래 키와 정확히 같아야 한다: 캠페인명, 시작일, 종료일, 채널, 구분, 쿠폰, 타겟, 부서, 담당자
function onFormSubmit_(e) {
  const values = e && e.namedValues ? e.namedValues : {};
  const get = function (key) { return (values[key] && values[key][0]) || ''; };
  const row = [
    get('캠페인명'), get('시작일'), get('종료일'), get('채널'),
    get('구분'), get('쿠폰'), get('타겟'), get('부서'), get('담당자'), ''
  ];
  targetSheet_().appendRow(row);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('POST 데이터가 없습니다.');
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'updateExecution') {
      const rowNumber = Number(data.rowNumber);
      if (!Number.isInteger(rowNumber) || rowNumber < 2 || !data.executionAt) {
        throw new Error('행 번호와 실행시각이 필요합니다.');
      }
      const sheet = targetSheet_();
      sheet.getRange(rowNumber, 10).setValue(data.executionAt);
      sheet.getRange(rowNumber, 13).setValue('배정 완료');
      sheet.getRange(rowNumber, 14).setValue(new Date().toISOString());
      return json_({ ok: true, updatedRow: rowNumber });
    }
    const row = [
      data.cmpgnNm || '', data.startDate || '', data.endDate || '', data.channel || '',
      data.category || '', data.coupon || '', data.target || '', data.department || '',
      data.owner || '', ''
    ];
    if (!row[0] || !row[1] || !row[2] || !row[3] || !row[8]) {
      throw new Error('캠페인명, 시작일, 종료일, 채널, 담당자는 필수입니다.');
    }
    targetSheet_().appendRow(row);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}
