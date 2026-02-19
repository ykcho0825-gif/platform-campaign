<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>캠페인 스케쥴링 시스템</title>
    <style>
        :root {
            --primary: #2563eb;
            --bg: #ffffff;
            --gray-light: #f8fafc;
            --gray-inactive: #e2e8f0;
            --border: #e2e8f0;
            --text: #1e293b;
            --input-bg: #f1f5f9; 
            --input-focus-bg: #e2e8f0;
            --button-default-bg: #ffffff;
            --button-default-text: #000000;
            --button-active-bg: #cbd5e1;
        }

        body {
            font-family: 'Pretendard', -apple-system, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 40px;
            border-bottom: 1px solid var(--border);
            background: #fff;
        }

        .logo { font-weight: 800; font-size: 1.4rem; color: #000; }

        .main-tabs { display: flex; gap: 10px; }
        .main-tab-btn {
            padding: 12px 28px;
            border: none;
            background-color: var(--gray-inactive);
            cursor: pointer;
            border-radius: 8px;
            font-weight: 600;
            color: #64748b;
            transition: all 0.2s ease;
        }
        .main-tab-btn.active { background-color: #000000; color: #ffffff; }

        .sub-nav { display: flex; padding: 25px 40px 0; gap: 25px; }
        .sub-tab-btn {
            padding: 10px 5px; border: none; background: none; cursor: pointer;
            font-size: 1.1rem; color: #94a3b8; border-bottom: 3px solid transparent;
        }
        .sub-tab-btn.active { color: var(--primary); border-bottom: 3px solid var(--primary); font-weight: 700; }

        .container { padding: 30px 40px; flex: 1; overflow-y: auto; }

        .card {
            background: #fff; border: 1px solid var(--border); border-radius: 16px;
            padding: 35px; max-width: 1000px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .grid-form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        label { font-size: 0.85rem; font-weight: 700; color: #475569; margin-left: 4px; }

        input, select {
            padding: 14px;
            border: none;
            border-radius: 12px;
            background-color: var(--input-bg);
            font-family: inherit;
            font-size: 14px;
            color: var(--text);
            transition: background-color 0.2s;
        }
        input:focus, select:focus {
            outline: none;
            background-color: var(--input-focus-bg);
        }

        .number-input { text-align: center; }

        .btn-submit {
            grid-column: span 2;
            background-color: var(--button-default-bg);
            color: var(--button-default-text);
            border: 2px solid #000000;
            padding: 18px; border-radius: 12px; cursor: pointer;
            font-weight: 700; font-size: 1.1rem; margin-top: 10px;
            transition: all 0.2s ease;
        }
        .btn-submit:hover { background-color: #f3f4f6; }
        .btn-submit.submitted {
            background-color: var(--button-active-bg) !important;
            color: #000 !important; border-color: #94a3b8 !important; cursor: default;
        }

        .assign-tool { display: flex; gap: 8px; align-items: center; }
        .btn-confirm { background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; border-bottom: 1px solid var(--border); text-align: left; }
        th { background: var(--gray-light); }

        /* 캘린더 스타일 */
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .cal-day { min-height: 130px; padding: 10px; border: 0.5px solid var(--border); background: #fff; }
        .cal-header { font-weight: bold; background: var(--gray-light); height: 45px; display: flex; align-items: center; justify-content: center; }
        
        /* 캘린더 태그 스타일 수정: 한 줄 표기 및 랜덤 블루톤 대비 */
        .event-tag { 
            font-size: 0.75rem; 
            padding: 6px 10px; 
            border-radius: 6px; 
            margin-top: 4px; 
            white-space: nowrap;      /* 한 줄 유지 */
            overflow: hidden;         /* 넘치는 글자 숨김 */
            text-overflow: ellipsis;  /* 말줄임표 적용 */
            display: block;
            border-left: 4px solid rgba(0,0,0,0.2);
            color: #fff;              /* 블루톤 대비 흰색 글자 */
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .hidden { display: none; }
    </style>
</head>
<body>

    <header>
        <div class="logo">캠페인 스케쥴링</div>
        <div class="main-tabs">
            <button id="main-user-btn" class="main-tab-btn active" onclick="switchMainTab('user')">사용자</button>
            <button id="main-admin-btn" class="main-tab-btn" onclick="switchMainTab('admin')">관리자</button>
        </div>
    </header>

    <div id="user-section">
        <div class="sub-nav">
            <button class="sub-tab-btn active" onclick="switchSubTab('user', 'apply')">캠페인 신청</button>
            <button class="sub-tab-btn" onclick="switchSubTab('user', 'calendar')">캠페인 캘린더</button>
        </div>
        <div class="container">
            <div id="user-apply" class="sub-content card">
                <form id="campaignForm" class="grid-form">
                    <div class="form-group"><label>캠페인 명</label><input type="text" id="name" placeholder="캠페인 제목"></div>
                    <div class="form-group">
                        <label>타겟 채널</label>
                        <div style="display:flex; gap:15px; padding-top:10px;">
                            <label><input type="checkbox" name="channel" value="SEG"> SEG</label>
                            <label><input type="checkbox" name="channel" value="토스트"> 토스트</label>
                            <label><input type="checkbox" name="channel" value="TV"> TV</label>
                        </div>
                    </div>
                    <div class="form-group"><label>캠페인 시작일</label><input type="date" id="startDate"></div>
                    <div class="form-group"><label>캠페인 종료일</label><input type="date" id="endDate"></div>
                    <div class="form-group"><label>GNB</label><input type="text" id="gnb" placeholder="GNB 위치"></div>
                    <div class="form-group">
                        <label>주기성 여부</label>
                        <select id="periodic"><option value="N">아니오</option><option value="Y">예</option></select>
                    </div>
                    <div class="form-group"><label>타겟 수</label><input type="text" id="targetCount" class="number-input" onkeyup="inputNumberFormat(this)" placeholder="0"></div>
                    <div class="form-group"><label>SEG ID 수</label><input type="text" id="segCount" class="number-input" onkeyup="inputNumberFormat(this)" placeholder="0"></div>
                    <div class="form-group"><label>부서</label><input type="text" id="dept" placeholder="부서명"></div>
                    <div class="form-group"><label>마케터</label><input type="text" id="marketer" placeholder="담당자 성함"></div>
                    <button type="button" id="submitBtn" class="btn-submit" onclick="handleApply()">신청하기</button>
                </form>
            </div>
            <div id="user-calendar" class="sub-content hidden">
                <div class="calendar-grid" id="calendarBody"></div>
            </div>
        </div>
    </div>

    <div id="admin-section" class="hidden">
        <div class="sub-nav">
            <button class="sub-tab-btn active" onclick="switchSubTab('admin', 'assign')">캠페인 일정 배정</button>
            <button class="sub-tab-btn" onclick="switchSubTab('admin', 'list')">배정 완료 목록</button>
        </div>
        <div class="container">
            <div id="admin-assign" class="sub-content card">
                <table>
                    <thead><tr><th>캠페인명</th><th>마케터</th><th>희망 기간</th><th>배정 시간 설정</th></tr></thead>
                    <tbody id="adminWaitList"></tbody>
                </table>
            </div>
            <div id="admin-list" class="sub-content hidden card">
                <table>
                    <thead><tr><th>확정 캠페인명</th><th>배정 시간</th><th>기간</th><th>마케터</th></tr></thead>
                    <tbody id="adminDoneList"></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let campaigns = [];
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;

        // 블루 계열의 랜덤 색상 생성 함수
        function getRandomBlue() {
            const blues = [
                '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', 
                '#60a5fa', '#0ea5e9', '#0284c7', '#0369a1',
                '#6366f1', '#4f46e5', '#4338ca'
            ];
            return blues[Math.floor(Math.random() * blues.length)];
        }

        function comma(str) { return String(str).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,'); }
        function uncomma(str) { return String(str).replace(/[^\d]+/g, ''); }
        function inputNumberFormat(obj) { obj.value = comma(uncomma(obj.value)); }

        function switchMainTab(target) {
            document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(target === 'user' ? 'main-user-btn' : 'main-admin-btn').classList.add('active');
            document.getElementById('user-section').classList.toggle('hidden', target !== 'user');
            document.getElementById('admin-section').classList.toggle('hidden', target !== 'admin');
            if(target === 'admin') updateAdminView();
        }

        function switchSubTab(parent, target) {
            const section = document.getElementById(`${parent}-section`);
            section.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            section.querySelectorAll('.sub-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`${parent}-${target}`).classList.remove('hidden');
            if(target === 'calendar') renderCalendar();
        }

        function handleApply() {
            const name = document.getElementById('name').value;
            const marketer = document.getElementById('marketer').value || '미지정';
            const btn = document.getElementById('submitBtn');
            if(!name) { alert("캠페인 명을 입력해주세요!"); return; }

            campaigns.push({
                id: Date.now(),
                name: name,
                start: document.getElementById('startDate').value,
                end: document.getElementById('endDate').value,
                marketer: marketer,
                status: 'pending',
                time: '',
                color: getRandomBlue() // 캠페인마다 고유 색상 할당
            });

            btn.classList.add('submitted'); btn.innerText = "신청 완료"; btn.disabled = true;

            setTimeout(() => {
                btn.classList.remove('submitted'); btn.innerText = "신청하기"; btn.disabled = false;
                document.getElementById('campaignForm').reset();
                document.getElementById('startDate').value = today;
                document.getElementById('endDate').value = today;
            }, 1500);
        }

        function updateAdminView() {
            const waitBody = document.getElementById('adminWaitList');
            const doneBody = document.getElementById('adminDoneList');
            waitBody.innerHTML = ''; doneBody.innerHTML = '';
            campaigns.forEach(c => {
                if(c.status === 'pending') {
                    waitBody.innerHTML += `<tr><td><strong>${c.name}</strong></td><td>${c.marketer}</td><td>${c.start}~${c.end}</td>
                        <td><div class="assign-tool"><input type="time" id="time-${c.id}" value="10:00" style="padding:5px;"><button class="btn-confirm" onclick="confirmSchedule(${c.id})">확정</button></div></td></tr>`;
                } else {
                    doneBody.innerHTML += `<tr><td>${c.name}</td><td>${c.time}</td><td>${c.start}~${c.end}</td><td>${c.marketer}</td></tr>`;
                }
            });
        }

        function confirmSchedule(id) {
            const timeVal = document.getElementById(`time-${id}`).value;
            const c = campaigns.find(x => x.id === id);
            c.status = 'confirmed'; c.time = timeVal;
            updateAdminView();
        }

        function renderCalendar() {
            const cal = document.getElementById('calendarBody');
            cal.innerHTML = '';
            ['일','월','화','수','목','금','토'].forEach(d => cal.innerHTML += `<div class="cal-header">${d}</div>`);
            
            for(let i=1; i<=28; i++) {
                const dateStr = `2026-02-${String(i).padStart(2, '0')}`;
                let eventsHtml = '';
                campaigns.filter(c => c.status === 'confirmed' && (dateStr >= c.start && dateStr <= c.end))
                         .forEach(c => {
                             // 캘린더 내 표시 정보: [시간] 캠페인명 (마케터) 형식의 한 줄 표기
                             eventsHtml += `
                                <div class="event-tag" style="background-color: ${c.color};" title="${c.time} ${c.name} (${c.marketer})">
                                    [${c.time}] ${c.name} (${c.marketer})
                                </div>`;
                         });
                cal.innerHTML += `<div class="cal-day"><small>${i}</small>${eventsHtml}</div>`;
            }
        }
    </script>
</body>
</html>
