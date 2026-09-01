# Power Automate로 캠페인 신청 시트 연동하기

구글시트/GAS 웹앱이 사내망·구글 정책에 막혀서, 캠페인 신청(`server/powerAutomateClient.js`)을
사내 M365 공유 엑셀(OneDrive/SharePoint)로 옮긴다. Power Automate 플로우 1개가
읽기(list) / 신청 등록(create) / 실행시각 확정(updateExecution) / '확정' 탭 전체 갱신
(syncConfirmed) 네 가지를 모두 처리한다.

대상 파일:
https://skbroadband-my.sharepoint.com/:x:/p/skb_3984/IQCaFFbyBCNBRb4WtCQOa_01ATsDT8O4guPZtCjqpMsv5Aw

## 0. 환경 선택 (중요)

make.powerautomate.com 오른쪽 위 환경이 **"skbroadband (default)"** 인지 먼저 확인한다.
커스텀/관리형 환경(예: 이름이 임의 GUID이거나 "Dataverse" 딸린 환경)에서 만들면 트리거
호출 시 `DirectApiAuthorizationRequired` (OAuth 인증 필요) 에러가 나서 서명(`sig=`) 붙은
URL을 못 받는다. Default 환경이면 서명 붙은 익명 호출 URL이 정상 발급된다.

## 1. 엑셀 파일 준비

1. 위 파일을 열고, 데이터 범위를 표(Table)로 변환한다 (범위 선택 후 `Ctrl+T`).
   Power Automate의 Excel Online 커넥터(행 추가/조회/수정)는 일반 범위가 아니라
   **표**에만 동작한다.
2. 표 이름을 지정한다 (표 디자인 탭 > 표 이름). 이 문서에서는 `신청목록`이라고 부른다.
3. 1행(헤더)에 아래 13개 컬럼을 A~M 순서로 그대로 만든다. 순서가 바뀌면 안 된다.

   | 열 | 헤더명 | 설명 |
   |---|---|---|
   | A | 캠페인명 | cmpgnNm |
   | B | 시작일 | startDate |
   | C | 종료일 | endDate |
   | D | 채널 | channel |
   | E | 구분 | category |
   | F | 쿠폰 | coupon |
   | G | 타겟 | target |
   | H | 부서 | department |
   | I | 담당자 | owner |
   | J | 실행시각 | executionAt (신청 시점엔 비워둠) |
   | K | 신청ID | applicationKey (Node가 생성한 고유값, 수정 시 이 값으로 행을 찾음) |
   | L | 상태 | 실행시각 확정 시 "배정 완료"로 채움 |
   | M | 배정시각 | 실행시각을 확정한 시각(ISO) |

4. 같은 워크북에 **'확정'이라는 이름의 시트를 하나 더** 만들고, 1행에 위 표의 A~J
   10개 헤더만 그대로 만든다 (K~M 신청ID/상태/배정시각은 없음). 이 시트도 데이터
   범위를 표로 변환하고(`Ctrl+T`) 표 이름을 지정한다 — 이 문서에서는 `확정`이라고
   부른다. 다른 사람이 신청목록 원본 대신 보기 편하게 참고하는 "확정된 캠페인만
   모은" 뷰로, `syncConfirmed` 케이스가 이 표 내용을 통째로 교체한다.

## 2. 플로우 생성

**만들기** > **인스턴트 클라우드 흐름** > 트리거: **"HTTP 요청이 수신되면"**
(내부 이름은 "manual" — 화면에 "manual"이라고 떠도 이 트리거가 맞다).

트리거의 "요청 본문 JSON 스키마"에 아래를 붙여넣는다 (네 가지 액션의 필드를 모두 포함하는
공용 스키마 — 액션마다 실제로 채워지는 필드만 다르다):

```json
{
  "type": "object",
  "properties": {
    "action": { "type": "string" },
    "cmpgnNm": { "type": "string" },
    "startDate": { "type": "string" },
    "endDate": { "type": "string" },
    "channel": { "type": "string" },
    "category": { "type": "string" },
    "coupon": { "type": "string" },
    "target": { "type": "string" },
    "department": { "type": "string" },
    "owner": { "type": "string" },
    "applicationKey": { "type": "string" },
    "executionAt": { "type": "string" },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "cmpgnNm": { "type": "string" },
          "startDate": { "type": "string" },
          "endDate": { "type": "string" },
          "channel": { "type": "string" },
          "category": { "type": "string" },
          "coupon": { "type": "string" },
          "target": { "type": "string" },
          "department": { "type": "string" },
          "owner": { "type": "string" },
          "executionAt": { "type": "string" }
        }
      }
    }
  }
}
```

(`rows`는 `syncConfirmed` 액션에서만 채워진다 — 백엔드가 신청목록 중 실행시각이 있는
행만 걸러서 통째로 보낸다.)

## 3. 변수 초기화 (트리거 바로 아래, Switch 밖 — 최상위)

Power Automate는 "변수 초기화"를 Switch/조건/반복문 등 제어 액션 **안에 넣을 수 없다**
(저장 시 에러). 반드시 트리거와 Switch 사이, 흐름의 최상위에 둔다.

- **+** → 변수 → **변수 초기화**
- 이름: `rows`, 유형: **배열**, 값: 비워둠

## 4. 분기 (Switch)

**+** → 컨트롤 → **전환(Switch)**

- **"켜기"** 입력칸 → 식(Expression) 탭 → `triggerBody()?['action']`
- **케이스 추가**로 4개 만들고, 각 케이스 값에 정확히(대소문자 포함) 입력:
  `create`, `list`, `updateExecution`, `syncConfirmed`
  (케이스 번호(1/2/3/4)는 화면상 순서일 뿐 의미 없다. 값만 정확하면 된다.)

### 케이스 `create`

1. **Excel Online (Business) > 표에 행 추가**
   - 위치: OneDrive for Business (파일이 `-my.sharepoint.com` 개인 OneDrive에 있으므로).
     "문서 라이브러리" 항목이 뜨면 보통 옵션이 하나뿐이니 그걸 선택.
   - 파일: 찾아보기로 선택 / 표: `신청목록`
   - 각 열은 전부 **동적 콘텐츠**로 매핑 (고정 텍스트 아님):
     캠페인명=`cmpgnNm`, 시작일=`startDate`, 종료일=`endDate`, 채널=`channel`,
     구분=`category`, 쿠폰=`coupon`, 타겟=`target`, 부서=`department`, 담당자=`owner`,
     신청ID=`applicationKey`
   - 실행시각 / 상태 / 배정시각은 비워둔다.
2. **응답(Response)**: 상태 코드 200, 본문 `{"ok": true}`

### 케이스 `list`

1. **Excel Online (Business) > 표의 행 나열** (같은 파일/표)
2. **컨트롤 > 반복 적용**: 입력 = "표의 행 나열"의 **값**(body/value)
3. 반복문 안에 **변수 > 배열 변수에 추가**: 이름 `rows`, 값 = **동적 콘텐츠**에서
   **"현재 항목"**을 그대로 선택.
   (엑셀 행 하나를 A~M 순서 배열로 직접 변환해서 넣으려 하면 실패한다 — Power Automate의
   "배열 변수에 추가"는 값으로 **배열(Array) 타입을 받을 수 없고** Float/Integer/String/
   Boolean/Object만 허용한다. 그래서 `createArray(...)`로 만든 값은 append가 안 되고
   `The input value is of type 'Array' which cannot be appended to the variable 'rows' of
   type 'Array'` 에러가 난다. 대신 행 객체(Object)를 그대로 쌓고, A~M 순서로 줄 세우는
   변환은 백엔드(`server/powerAutomateClient.js`의 `ROW_COLUMNS`)에서 처리한다.)
4. 반복문 **밖으로 나와서** **응답(Response)**: 본문에 정확히:
   ```
   {"rows": @{variables('rows')}}
   ```
   (중괄호와 `"rows":`는 직접 타이핑, `@{variables('rows')}`는 동적 콘텐츠에서 `rows`
   선택. 이 형태를 안 지키면 — 예를 들어 그냥 배열만 반환하면 — 백엔드가 못 읽는다.)

### 케이스 `updateExecution`

1. **Excel Online (Business) > 행 업데이트**
   - 파일/표: 동일하게 선택
   - 키 열: `신청ID` / 키 값: 동적 콘텐츠 `applicationKey`
   - 실행시각 = `executionAt`, 상태 = 고정 텍스트 `배정 완료`, 배정시각 = 식 `utcNow()`
2. **응답(Response)**: 상태 코드 200, 본문 `{"ok": true}`

전체 구조:
```
트리거
변수 초기화 (rows, 배열)
Switch (켜기: triggerBody()?['action'])
 ├─ create: 표에 행 추가 → 응답
 ├─ list: 표의 행 나열 → 반복 적용(배열 변수에 추가: 현재 항목) → 응답
 ├─ updateExecution: 행 업데이트 → 응답
 └─ syncConfirmed: '확정' 표의 행 나열 → 반복 적용(행 삭제)
                   → 반복 적용(rows 배열, 행 추가) → 응답
```

### 케이스 `syncConfirmed`

'확정' 표를 지금 요청으로 들어온 `rows` 배열로 통째로 교체한다 (기존 내용은 지워진다).

1. **Excel Online (Business) > 표의 행 나열** — 파일: 동일 / 표: `확정` (기존 내용을 지우기
   위해 먼저 몇 행이 있는지/무엇인지 가져오는 용도)
2. **컨트롤 > 반복 적용**: 입력 = 위 "표의 행 나열"의 **값**
   - 반복문 안에 **Excel Online (Business) > 표에서 행 삭제**: 파일/표 동일, 키 열/키 값은
     "현재 항목"의 아무 고유 열이나 사용 (이 표엔 신청ID가 없으므로 커넥터가 요구하는
     키 열 = 표의 첫 번째 열 "캠페인명", 키 값 = 현재 항목의 캠페인명 사용. 동명 캠페인이
     여러 행이면 이 방식으로는 한 번에 하나씩만 지워지니, 표에 행이 많이 쌓인 상태로
     오래 방치하지 말고 자주 갱신할 것)
3. 반복문 **밖으로 나와서** 두 번째 **컨트롤 > 반복 적용**: 입력 = 식 `triggerBody()?['rows']`
   - 반복문 안에 **Excel Online (Business) > 표에 행 추가**: 파일: 동일 / 표: `확정`
   - 각 열은 전부 **동적 콘텐츠**로 매핑 (모두 "현재 항목"의 하위 필드):
     캠페인명=`cmpgnNm`, 시작일=`startDate`, 종료일=`endDate`, 채널=`channel`,
     구분=`category`, 쿠폰=`coupon`, 타겟=`target`, 부서=`department`, 담당자=`owner`,
     실행시각=`executionAt`
4. 반복문 밖으로 나와서 **응답(Response)**: 상태 코드 200, 본문 `{"ok": true}`

## 5. 연결

1. 저장 후, 트리거 카드의 **"HTTP POST URL"**(또는 "HTTP URL")을 복사한다.
   **복사 아이콘을 클릭하거나, 입력칸 안을 클릭 후 Ctrl+A → Ctrl+C로 전체를 복사한다.**
   텍스트를 직접 드래그해서 복사하면 뒷부분(서명 `sig=...`)이 잘리는 경우가 많다.
   제대로 된 URL은 `...&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=`로 끝나는 긴 문자열이
   붙어있다. 이게 없으면(그냥 `...?api-version=1`로 끝나면) 십중팔구 복사가 잘렸거나,
   플로우 어딘가 저장이 덜 된 상태다.
2. `.env`의 `POWER_AUTOMATE_WEBHOOK_URL`에 붙여넣는다.
3. Node가 이 사내망 프록시의 TLS 인터셉션 인증서를 신뢰하도록, 서버는 반드시
   `--use-system-ca` 플래그로 실행한다 (`package.json`의 `server`/`start` 스크립트에
   이미 반영되어 있음). 이거 없으면 `SELF_SIGNED_CERT_IN_CHAIN` 에러가 난다.
4. 서버 재시작(`npm run server` 또는 `npm run dev:all`) 후, "캠페인 신청하기"
   버튼으로 테스트 신청을 하나 넣고 엑셀 파일에 행이 추가되는지, 관리자모드 목록에
   다시 나타나는지 확인한다.
