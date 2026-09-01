const campaigns = [
  {
    cmpgnId: "CMP-001",
    cmpgnNm: "Back to School Bundle",
    owner: "김하늘",
    prodNm: "기가 인터넷",
    copnYn: true,
    toastYn: true,
    svcCnt: 18240,
    copnUseCnt: 1240,
    toast: { pop: 24000, show: 19320, click: 4820, go: 1960, exit: 3880, showRate: 0.805, clickRate: 0.25 },
    smart: { pop: 18800, show: 15120, click: 3410, go: 1390, exit: 2510, showRate: 0.804, clickRate: 0.225 },
  },
  {
    cmpgnId: "CMP-002",
    cmpgnNm: "Family Streaming Boost",
    owner: "박준호",
    prodNm: "B tv",
    copnYn: true,
    toastYn: false,
    svcCnt: 14560,
    copnUseCnt: 980,
    toast: { pop: 16800, show: 13240, click: 2860, go: 940, exit: 2620, showRate: 0.788, clickRate: 0.216 },
    smart: { pop: 21400, show: 18060, click: 4720, go: 1840, exit: 2910, showRate: 0.844, clickRate: 0.261 },
  },
  {
    cmpgnId: "CMP-003",
    cmpgnNm: "Weekend Upgrade Offer",
    owner: "이서윤",
    prodNm: "AI Sound Max",
    copnYn: false,
    toastYn: true,
    svcCnt: 9840,
    copnUseCnt: 0,
    toast: { pop: 12400, show: 10110, click: 2110, go: 760, exit: 1920, showRate: 0.815, clickRate: 0.209 },
    smart: { pop: 9400, show: 7420, click: 1580, go: 590, exit: 1260, showRate: 0.789, clickRate: 0.213 },
  },
];

const campaignCatalog = [
  { cmpgnId: "CMP-001", cmpgnNm: "Back to School Bundle", owner: "김하늘", channel: "TOAST", product: "기가 인터넷" },
  { cmpgnId: "CMP-002", cmpgnNm: "Family Streaming Boost", owner: "박준호", channel: "SMART", product: "B tv" },
  { cmpgnId: "CMP-003", cmpgnNm: "Weekend Upgrade Offer", owner: "이서윤", channel: "TOAST", product: "AI Sound Max" },
  { cmpgnId: "CMP-004", cmpgnNm: "Summer Retention Push", owner: "최민아", channel: "SMART", product: "스마트홈" },
  { cmpgnId: "CMP-005", cmpgnNm: "Premium Upgrade Wave", owner: "김하늘", channel: "TOAST", product: "B tv" },
];

let applications = [
  {
    applicationId: "APP-001",
    cmpgnId: "CMP-001",
    cmpgnNm: "Back to School Bundle",
    owner: "김하늘",
    channel: "TOAST",
    category: "프로모션",
    coupon: "신규가입 10% 할인",
    target: 4200,
    department: "마케팅1팀",
    campaignMonth: "2026-08",
    startDate: "2026-08-29",
    endDate: "2026-09-02",
    expectedVolume: 4200,
    budget: 1800000,
    memo: "개강 시즌 타겟 집중 운영",
  },
  {
    applicationId: "APP-002",
    cmpgnId: "CMP-002",
    cmpgnNm: "Family Streaming Boost",
    owner: "박준호",
    channel: "SMART",
    category: "리텐션",
    coupon: "셋톱박스 업그레이드 쿠폰",
    target: 2600,
    department: "CRM팀",
    campaignMonth: "2026-09",
    startDate: "2026-09-03",
    endDate: "2026-09-05",
    expectedVolume: 2600,
    budget: 950000,
    memo: "주말 번들 전환 유도",
  },
];

const coupons = [
  { cmpgnId: "CMP-001", cmpgnNm: "Back to School Bundle", copnPlcyNm: "신규가입 10% 할인", issued: 4200, used: 1240, useRate: 0.295 },
  { cmpgnId: "CMP-002", cmpgnNm: "Family Streaming Boost", copnPlcyNm: "셋톱박스 업그레이드 쿠폰", issued: 3610, used: 980, useRate: 0.271 },
  { cmpgnId: "CMP-003", cmpgnNm: "Weekend Upgrade Offer", copnPlcyNm: "주말 한정 사은 쿠폰", issued: 1850, used: 420, useRate: 0.227 },
];

const productChannel = [
  { product: "기가 인터넷", TOAST: 9200, SMART: 7100 },
  { product: "B tv", TOAST: 5100, SMART: 9800 },
  { product: "AI Sound Max", TOAST: 4300, SMART: 3600 },
];

const campaignDayband = [
  { cmpgnId: "CMP-001", cmpgnNm: "Back to School Bundle", "0일": 1240, "1-3일": 3820, "4-7일": 2110, "8일+": 760 },
  { cmpgnId: "CMP-002", cmpgnNm: "Family Streaming Boost", "0일": 980, "1-3일": 3040, "4-7일": 1940, "8일+": 540 },
  { cmpgnId: "CMP-003", cmpgnNm: "Weekend Upgrade Offer", "0일": 420, "1-3일": 1680, "4-7일": 920, "8일+": 310 },
];

const calendarActual = [
  { date: "20260821", value: 820 },
  { date: "20260822", value: 910 },
  { date: "20260823", value: 1020 },
  { date: "20260824", value: 980 },
  { date: "20260825", value: 1140 },
  { date: "20260826", value: 1280 },
  { date: "20260827", value: 1360 },
];

const calendarForecast = [
  { date: "20260828", value: 1410 },
  { date: "20260829", value: 1470 },
  { date: "20260830", value: 1520 },
  { date: "20260831", value: 1580 },
  { date: "20260901", value: 1630 },
  { date: "20260902", value: 1670 },
  { date: "20260903", value: 1710 },
];

export function getMockSummary() {
  const totals = campaigns.reduce(
    (acc, campaign) => {
      acc.campaignCount += 1;
      acc.toast.pop += campaign.toast.pop;
      acc.toast.show += campaign.toast.show;
      acc.toast.click += campaign.toast.click;
      acc.toast.go += campaign.toast.go;
      acc.toast.exit += campaign.toast.exit;
      acc.smart.pop += campaign.smart.pop;
      acc.smart.show += campaign.smart.show;
      acc.smart.click += campaign.smart.click;
      acc.smart.go += campaign.smart.go;
      acc.smart.exit += campaign.smart.exit;
      acc.coupon.issued += campaign.copnYn ? coupons.find((coupon) => coupon.cmpgnId === campaign.cmpgnId)?.issued || 0 : 0;
      acc.coupon.used += campaign.copnUseCnt;
      return acc;
    },
    {
      campaignCount: 0,
      toast: { pop: 0, show: 0, click: 0, go: 0, exit: 0 },
      smart: { pop: 0, show: 0, click: 0, go: 0, exit: 0 },
      coupon: { issued: 0, used: 0 },
    }
  );

  totals.toast.showRate = totals.toast.pop ? totals.toast.show / totals.toast.pop : 0;
  totals.toast.clickRate = totals.toast.show ? totals.toast.click / totals.toast.show : 0;
  totals.smart.showRate = totals.smart.pop ? totals.smart.show / totals.smart.pop : 0;
  totals.smart.clickRate = totals.smart.show ? totals.smart.click / totals.smart.show : 0;
  totals.coupon.useRate = totals.coupon.issued ? totals.coupon.used / totals.coupon.issued : 0;
  return totals;
}

export function getMockCampaigns() {
  return campaigns;
}

export function getMockCampaign(id) {
  return campaigns.find((campaign) => campaign.cmpgnId === id) || null;
}

export function getMockCoupons() {
  return coupons;
}

export function getMockFunnel(channel = "toast", cmpgnId) {
  const prefix = channel === "smart" ? "smart" : "toast";
  const source = cmpgnId ? getMockCampaign(cmpgnId) : null;
  const metrics = source
    ? source[prefix]
    : campaigns.reduce(
        (acc, campaign) => ({
          pop: acc.pop + campaign[prefix].pop,
          show: acc.show + campaign[prefix].show,
          click: acc.click + campaign[prefix].click,
          go: acc.go + campaign[prefix].go,
          exit: acc.exit + campaign[prefix].exit,
        }),
        { pop: 0, show: 0, click: 0, go: 0, exit: 0 }
      );

  return {
    channel: prefix,
    steps: [
      { stage: "모수", value: metrics.pop },
      { stage: "노출", value: metrics.show },
      { stage: "클릭", value: metrics.click },
      { stage: "전환", value: metrics.go },
    ],
    exit: metrics.exit,
  };
}

export function getMockTrend(type = "popup") {
  if (type === "coupon") {
    return {
      type,
      points: [
        { day: 0, cnt: 120, cumulativePct: 0.16 },
        { day: 1, cnt: 210, cumulativePct: 0.44 },
        { day: 3, cnt: 180, cumulativePct: 0.68 },
        { day: 7, cnt: 140, cumulativePct: 0.86 },
        { day: 14, cnt: 105, cumulativePct: 1 },
      ],
    };
  }

  return {
    actual: calendarActual,
    forecast: calendarForecast,
  };
}

export function getMockCohort(type = "popup") {
  return type === "coupon"
    ? {
        type,
        points: [
          { day: 0, cnt: 120, cumulativePct: 0.16 },
          { day: 1, cnt: 210, cumulativePct: 0.44 },
          { day: 3, cnt: 180, cumulativePct: 0.68 },
          { day: 7, cnt: 140, cumulativePct: 0.86 },
          { day: 14, cnt: 105, cumulativePct: 1 },
        ],
      }
    : {
        type,
        points: [
          { day: 0, cnt: 460, cumulativePct: 0.21 },
          { day: 1, cnt: 610, cumulativePct: 0.48 },
          { day: 3, cnt: 540, cumulativePct: 0.72 },
          { day: 7, cnt: 390, cumulativePct: 0.89 },
          { day: 14, cnt: 250, cumulativePct: 1 },
        ],
      };
}

export function getMockCross(route) {
  return route === "campaign-dayband" ? campaignDayband : productChannel;
}

export function getMockProducts() {
  return [
    {
      prodNm: "기가 인터넷",
      campaignCount: 1,
      svcCnt: 18240,
      copnUseCnt: 1240,
      toast: { showRate: 0.805, clickRate: 0.25 },
      smart: { showRate: 0.804, clickRate: 0.225 },
    },
    {
      prodNm: "B tv",
      campaignCount: 1,
      svcCnt: 14560,
      copnUseCnt: 980,
      toast: { showRate: 0.788, clickRate: 0.216 },
      smart: { showRate: 0.844, clickRate: 0.261 },
    },
    {
      prodNm: "AI Sound Max",
      campaignCount: 1,
      svcCnt: 9840,
      copnUseCnt: 0,
      toast: { showRate: 0.815, clickRate: 0.209 },
      smart: { showRate: 0.789, clickRate: 0.213 },
    },
  ];
}

export function searchMockCampaignCatalog({ owner = "", campaignName = "" } = {}) {
  const ownerKeyword = owner.trim().toLowerCase();
  const campaignKeyword = campaignName.trim().toLowerCase();
  return campaignCatalog.filter((campaign) => {
    const ownerMatched = ownerKeyword ? campaign.owner.toLowerCase().includes(ownerKeyword) : true;
    const campaignMatched = campaignKeyword ? campaign.cmpgnNm.toLowerCase().includes(campaignKeyword) : true;
    return ownerMatched && campaignMatched;
  });
}

export function listMockApplications() {
  return applications;
}

export function createMockApplication(payload) {
  const newApplication = {
    applicationId: `APP-${String(applications.length + 1).padStart(3, "0")}`,
    cmpgnId: payload.cmpgnId,
    cmpgnNm: payload.cmpgnNm,
    owner: payload.owner,
    channel: payload.channel,
    category: payload.category || "",
    coupon: payload.coupon || "",
    target: Number(payload.target || payload.expectedVolume || 0),
    department: payload.department || "",
    campaignMonth: payload.campaignMonth || payload.startDate.slice(0, 7),
    startDate: payload.startDate,
    endDate: payload.endDate,
    expectedVolume: Number(payload.expectedVolume || 0),
    budget: Number(payload.budget || 0),
    memo: payload.memo || "",
  };
  applications = [newApplication, ...applications];
  return newApplication;
}
