# Google Sheets 연동 가이드

기준 날짜: 2026-08-28

`캠페인 신청하기` 버튼으로 아래 시트에 한 줄씩 적재하려면 Google Apps Script 웹앱을 중간에 두는 방식이 가장 간단합니다.

대상 시트:
`https://docs.google.com/spreadsheets/d/1V1476ZgCyUd8q0DB-8rSp6mi_Q4PRHAwYbU8UoZEhSU/edit?gid=1621616972#gid=1621616972`

시트 컬럼 순서:

1. `캠페인 명`
2. `시작일`
3. `종료일`
4. `채널`
5. `구분`
6. `쿠폰`
7. `타겟`
8. `부서`
9. `담당자`

## 1. Apps Script 코드

구글시트에서 `확장 프로그램 > Apps Script`로 들어간 뒤 아래 코드를 붙여넣습니다.

```javascript
function doPost(e) {
  const SHEET_ID = '1V1476ZgCyUd8q0DB-8rSp6mi_Q4PRHAwYbU8UoZEhSU';
  const SHEET_NAME = '시트1';

  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    sheet.appendRow([
      data.cmpgnNm || '',
      data.startDate || '',
      data.endDate || '',
      data.channel || '',
      data.category || '',
      data.coupon || '',
      data.target || '',
      data.department || '',
      data.owner || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

`SHEET_NAME`은 실제 탭 이름으로 바꿔야 합니다. 탭 이름을 모르는 경우 아래처럼 `gid`로 찾는 방식이 안전합니다.

```javascript
const SHEET_ID = '1V1476ZgCyUd8q0DB-8rSp6mi_Q4PRHAwYbU8UoZEhSU';
const SHEET_GID = 1621616972;

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTargetSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheets().find(function (item) {
    return item.getSheetId() === SHEET_GID;
  });
  if (!sheet) throw new Error('gid ' + SHEET_GID + ' 탭을 찾을 수 없습니다.');
  return sheet;
}

function doGet() {
  return json_({ ok: true, sheet: getTargetSheet_().getName() });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const values = [data.cmpgnNm || '', data.startDate || '', data.endDate || '',
      data.channel || '', data.category || '', data.coupon || '', data.target || '',
      data.department || '', data.owner || '', ''];
    if (!values[0] || !values[1] || !values[2] || !values[3] || !values[8]) {
      throw new Error('캠페인명, 시작일, 종료일, 채널, 담당자는 필수입니다.');
    }
    getTargetSheet_().appendRow(values);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}
```

위 코드로 교체하면 탭 이름과 무관하게 `gid=1621616972` 탭의 다음 행에 A~J 값이 누적됩니다. 기존 배포는 자동으로 바뀌지 않으므로 반드시 `배포 > 배포 관리 > 새 버전`으로 재배포해야 합니다.

## 2. 배포 방법

1. Apps Script 화면 우측 상단 `배포 > 새 배포`를 누릅니다.
2. 유형은 `웹 앱`을 선택합니다.
3. 설명은 예: `campaign request append`
4. 실행 사용자: `나`
5. 액세스 권한:
   `링크가 있는 모든 사용자`
   또는 조직 정책에 맞는 공개 범위
6. 배포 후 생성된 `웹 앱 URL`을 복사합니다.

이 URL은 보통 `https://script.google.com/macros/s/.../exec` 형태입니다.

## 3. 현재 페이지에 연결하는 위치

[public/report.html](/Users/yukyungcho/Documents/vs code 연동/playground-cmpgn-1/public/report.html) 안에서 아래 상수를 찾습니다.

```javascript
const APPS_SCRIPT_URL = '';
```

여기에 배포된 웹앱 URL을 넣으면 됩니다.

예:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxisZegApg2pYAZm_890ySwny7HZP3y67kmJZ-DOTBDD4tqANxfneRfhEVPZAwp4vgdgQ/exec';
```

## 4. 현재 페이지 동작 방식

지금 버튼 클릭 시 2곳으로 저장되도록 준비되어 있습니다.

1. 로컬 백엔드 JSON 저장
   `[server/data/applications.json](/Users/yukyungcho/Documents/vs code 연동/playground-cmpgn-1/server/data/applications.json)`
2. Apps Script URL이 비어 있지 않으면 구글시트에도 append

즉, URL만 넣으면 같은 버튼으로 로컬 저장 + 구글시트 적재가 같이 됩니다.

## 5. 프런트에서 보내는 데이터 예시

```json
{
  "cmpgnNm": "B tv+ 12개월 50% 할인",
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "channel": "토스트팝업",
  "category": "일회성",
  "coupon": "쿠폰",
  "target": "100000",
  "department": "B tv플러스팀",
  "owner": "조유경"
}
```

## 6. 자주 막히는 지점

1. Apps Script 배포는 했지만 권한 범위가 좁아서 403이 나는 경우
2. `SHEET_NAME`이 실제 탭명과 달라 append가 실패하는 경우
3. 브라우저 캐시 때문에 예전 `report.html`이 남아 있는 경우

페이지 반영 확인 링크:
`http://localhost:5174/campaign-dashboard0-v2-4/report.html#calendar`

## 7. 담당자 모드 · 시간 배정 (실행가능 여부 검토)

`캠페인 신청 및 캘린더` 페이지 상단의 `담당자 모드` 버튼을 누르면 열리는 모달(`index.html` 내 `ownerModeModal`)이 시간 배정 기능입니다. 이 모달은 두 개의 시트를 함께 읽습니다.

1. `gid=0` (확정 캠페인 캘린더, `window.__campaignRequestSource`에 캐시됨, 읽기 전용): 이미 확정된 캠페인의 실행시각을 기준으로 그날의 시간대 점유 현황을 계산하는 데 사용됩니다. 캠페인 신청 폼의 "실행 가능 여부 검토"(일별 배너/쿠폰 capa) 카드가 쓰는 것과 같은 원본 데이터입니다.
2. `gid=1621616972` (`new_dashboard`, 신청 대기열): 아직 `J열 실행시각`이 비어 있는 신청 건을 배정 대상으로 보여줍니다.

capa 계산 기준(신청 파트의 "실행 가능 여부 검토"와 같은 방식 - 신청량 합산 vs capa 비교 - 을 시간 단위로 적용):

- 쿠폰 캠페인: 시간당 120,000건. 같은 시간에 여러 캠페인이 몰려도 합계가 120,000건을 넘지 않으면 함께 배정됩니다. 한 캠페인의 타겟 수가 120,000을 넘으면 `타겟 수 ÷ 120,000`을 올림한 시간만큼 연속으로 점유합니다.
- 배너/팝업(쿠폰 없음) 캠페인: 시간당 2,800,000건, 동일한 방식(합산 capa)으로 계산합니다.
- 쿠폰 capa와 배너 capa는 서로 다른 자원이라 독립적으로 관리됩니다(쿠폰이 꽉 차도 배너는 영향받지 않음).
- 같은 날짜(01~23시) 안에서 신청 대기 건은 신청 순서(시트 행 순서) → 월정액 상품 우선 순서로 정렬해 순차적으로 빈 자리를 찾아 추천 시각을 채웁니다. 담당자는 추천된 시각을 그대로 두거나 직접 다른 시간으로 바꿀 수 있고, capa를 초과하는 시간을 고르면 경고와 함께 확인을 받습니다.
- 각 신청 카드 하단에는 그날 확정/신청된 다른 캠페인 목록("당일 캠페인 현황")이 함께 표시되어, 신청 이력을 화면 분할 없이 한 카드 안에서 바로 확인할 수 있습니다.
- 모달 상단의 `배정 대기` / `배정완료` 탭으로 전환할 수 있고, `배정완료` 탭은 배정(실행시각 확정) 작업을 수행한 시점이 최근 2일 이내인 건만 보여줍니다. 60초마다 시트를 자동으로 다시 불러와 반영합니다.

`docs/Code.gs`의 `updateExecution` 액션은 이제 `N열(14번째 컬럼)`에 배정을 확정한 시각(ISO 문자열)을 함께 기록합니다. `배정완료` 탭은 이 값을 읽어 "최근 2일 이내에 배정한 캠페인"만 보여줍니다.

**주의:** 기존에 배포된 Apps Script 웹앱은 이 변경사항이 자동으로 반영되지 않습니다. `docs/Code.gs`의 최신 코드를 다시 붙여넣고 `배포 > 배포 관리 > 새 버전`으로 재배포해야 N열 기록과 `배정완료` 탭이 정상 동작합니다. 재배포 전까지 배정완료 처리된 기존 항목은 N열 값이 없어 `배정완료` 탭에 나타나지 않으며, 화면에 해당 안내 문구가 표시됩니다.
