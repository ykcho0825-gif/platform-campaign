# campaign-dashboard0-v2-4

React + Vite + Typescript SPA 애플리케이션입니다.

## 바로가기

- [Playground 앱 상세 페이지](https://playground.skbroadband.com/apps/web-services/default/campaign-dashboard0-v2-4)
- [배포된 앱](https://pg-apps.skbroadband.com/campaign-dashboard0-v2-4)

---

## 🔗 마이크로서비스 통신 가이드 (내부 네트워크)

Kubernetes 내부 네트워크에서 다른 앱이 **현재 생성된 이 앱(campaign-dashboard0-v2-4)**에 접근할 때 사용하는 내부 DNS 주소입니다.

| 접근 주체 | 연결 주소(URL) |
| :--- | :--- |
| **같은 프로젝트(team-campaign-dashboard-v2) 내의 다른 앱** | `http://dev-campaign-dashboard0-v2-4:8080` |
| **타 프로젝트(Namespace)의 다른 앱** | `http://dev-campaign-dashboard0-v2-4.team-campaign-dashboard-v2.svc.cluster.local:8080` |

> 💡 **환경별 서비스명 접두사 (Prefix)**
> 배포 환경에 따라 서비스 이름 앞에 환경 이름이 붙습니다. 
> - 개발(Dev) 환경: `dev-campaign-dashboard0-v2-4`
> - 운영(Prod) 환경: `campaign-dashboard0-v2-4` (접두사 없음)
> - 기타 환경: `{환경명}-campaign-dashboard0-v2-4`

### ⚙️ Kubernetes 추천 세팅 가이드
* **환경 변수(Env) 활용:** 다른 앱의 URL이나 DB 접속 정보는 소스코드에 하드코딩하지 말고, 플랫폼의 **Secret Manager**를 통해 환경 변수로 주입받도록 구성하세요 (`process.env.DB_HOST` 등 활용).
* **Health Check API:** Kubernetes가 앱의 상태를 주기적으로 체크할 수 있도록, 상태 반환 엔드포인트(예: `GET /healthz`)를 열어두는 것이 무중단 배포 안정성에 도움이 됩니다.
* **Graceful Shutdown:** SIGTERM 신호를 받았을 때 진행 중인 요청을 안전하게 마무리하고 종료되도록 코드를 작성하는 것을 권장합니다.

---

## VSCode Server에서 미리보기

웹 IDE(code-server)에서 dev 서버는 sub-path(`/<워크스페이스>/absproxy/<port>`)로 노출됩니다.
링크·정적자산이 깨지지 않게 그 경로를 `BASE_PATH`로 알려줘야 하며, 워크스페이스에 사전 설치된
`dev-preview`가 자동 처리합니다. (vite `base`의 끝 `/`는 설정 파일에서 자동 보정)

**방법 1 — `dev-preview` (권장)**: 포트와 실행명령만 주면 base path를 자동 주입합니다.

```bash
dev-preview 5173 npm run dev
```

**방법 2 — 직접 설정**: 헬퍼 없이, 프리뷰 주소창의 **전체 경로**를 `BASE_PATH`로 지정합니다.

```bash
BASE_PATH=/<워크스페이스>/absproxy/5173 npm run dev
```

- **prod 빌드 시엔 미설정** — `serviceName` 기반 base가 자동 적용됩니다

---

## 기술 스택

- React 19 + TypeScript + Vite
- Express 5에서 React 빌드 결과와 내부 API 제공
- basePath: `/campaign-dashboard0-v2-4/`
## 캘린더 Google Sheet 스냅샷

하단 캠페인 캘린더는 Google Sheet `gid=0`을 빌드에 포함된 스냅샷으로 읽습니다. Google 접근이 가능한 Windows 환경에서 다음 명령으로 갱신합니다.

```powershell
npm run sync:calendar
```

이 명령은 응답 형식, `시작일` 헤더 및 데이터 존재 여부를 검증한 뒤에만 다음 파일을 원자적으로 교체합니다.

- `server/data/google-sheets/calendar.gviz`
- `server/data/google-sheets/calendar-metadata.json`

Express 조회 경로:

- 캘린더 스냅샷: `/api/applications/sheet?gid=0`
- 스냅샷 상태: `/api/applications/sheet/status`

동기화가 실패하면 기존 정상 스냅샷은 유지됩니다. 신청·배정 데이터와 쓰기 경로는 이 동기화 대상에 포함하지 않습니다.
