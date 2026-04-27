// Adapted from expo-tosspayments-webview (MIT License)
// https://github.com/gs0428/expo-tosspayments-webview

const { withAndroidManifest } = require("@expo/config-plugins");

// 주입할 패키지 목록
const QUERY_PACKAGES = [
  { name: "com.kakao.talk" }, // 카카오톡
  { name: "com.nhn.android.search" }, // 네이버페이
  { name: "com.samsung.android.spay" }, // 삼성페이
  { name: "net.ib.android.smcard" }, // 모니모페이
  { name: "com.mobiletoong.travelwallet" }, // 신한카드 트레블월렛
  { name: "com.samsung.android.spaylite" }, // 삼성페이
  { name: "com.ssg.serviceapp.android.egiftcertificate" }, // SSGPAY
  { name: "com.nhnent.payapp" }, // PAYCO
  { name: "com.lottemembers.android" }, // L.POINT
  { name: "viva.republica.toss" }, // 토스
  { name: "com.shinhan.smartcaremgr" }, // 신한 슈퍼SOL
  { name: "com.shinhan.sbanking" }, // 신한 SOL뱅크
  { name: "com.shcard.smartpay" }, // 신한페이판
  { name: "com.shinhancard.smartshinhan" }, // 신한페이판-공동인증서
  { name: "com.hyundaicard.appcard" }, // 현대카드
  { name: "com.lumensoft.touchenappfree" }, // 현대카드-공동인증서
  { name: "kr.co.samsungcard.mpocket" }, // 삼성카드
  { name: "nh.smart.nhallonepay" }, // 올원페이
  { name: "com.kbcard.cxh.appcard" }, // KB Pay
  { name: "com.kbstar.liivbank" }, // Liiv(KB국민은행)
  { name: "com.kbstar.reboot" }, // Liiv Reboot(KB국민은행)
  { name: "com.kbstar.kbbank" }, // 스타뱅킹(KB국민은행)
  { name: "kvp.jjy.MispAndroid320" }, // ISP/페이북
  { name: "com.lcacApp" }, // 롯데카드
  { name: "com.hanaskcard.paycla" }, // 하나카드
  { name: "com.hanaskcard.rocomo.potal" }, // 하나카드
  { name: "kr.co.hanamembers.hmscustomer" }, // 하나멤버스
  { name: "kr.co.citibank.citimobile" }, // 씨티모바일
  { name: "com.wooricard.wpay" }, // 우리페이
  { name: "com.wooricard.smartapp" }, // 우리카드
  { name: "com.wooribank.smart.npib" }, // 우리WON뱅킹
  { name: "com.lguplus.paynow" }, // 페이나우
  { name: "com.kftc.bankpay.android" }, // 뱅크페이
  { name: "com.TouchEn.mVaccine.webs" }, // TouchEn mVaccine (신한)
  { name: "kr.co.shiftworks.vguardweb" }, // V-Guard (삼성)
  { name: "com.ahnlab.v3mobileplus" }, // V3 (NH, 현대)
  { name: "com.kakaobank.channel" }, // 카카오뱅크
];

// AndroidManifest.xml에 queries 섹션을 추가하는 함수
function addQueriesToManifest(androidManifest) {
  const { manifest } = androidManifest;

  if (!manifest) {
    return androidManifest;
  }

  // queries 섹션이 이미 있는지 확인
  if (!manifest.queries) {
    manifest.queries = [];
  }

  // 기존 package 요소들을 확인하여 중복 제거
  const existingPackages = new Set();
  if (Array.isArray(manifest.queries)) {
    manifest.queries.forEach((query) => {
      if (
        typeof query === "object" &&
        query !== null &&
        "package" in query &&
        Array.isArray(query.package)
      ) {
        query.package.forEach((pkg) => {
          if (
            typeof pkg === "object" &&
            pkg !== null &&
            "$" in pkg &&
            typeof pkg.$ === "object" &&
            pkg.$ !== null &&
            "android:name" in pkg.$
          ) {
            const pkgAttributes = pkg.$;
            const packageName = pkgAttributes["android:name"];
            if (typeof packageName === "string") {
              existingPackages.add(packageName);
            }
          }
        });
      }
    });
  }

  // 새로운 패키지들을 추가
  const packagesToAdd = QUERY_PACKAGES.filter((pkg) => !existingPackages.has(pkg.name));

  if (packagesToAdd.length > 0) {
    // package 요소들을 생성
    const packageElements = packagesToAdd.map((pkg) => ({
      $: {
        "android:name": pkg.name,
      },
    }));

    // queries 배열에 package 요소들을 가진 객체 추가
    if (!Array.isArray(manifest.queries)) {
      manifest.queries = [];
    }

    // 기존에 package가 있는 query를 찾거나 새로 생성
    let packageQuery = manifest.queries.find(
      (query) =>
        typeof query === "object" &&
        query !== null &&
        "package" in query &&
        Array.isArray(query.package)
    );

    if (!packageQuery) {
      packageQuery = { package: [] };
      manifest.queries.push(packageQuery);
    }

    // 패키지들을 추가
    packageQuery.package.push(...packageElements);
  }

  return androidManifest;
}

// Android queries 플러그인
const withAndroidQueries = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = addQueriesToManifest(config.modResults);
    return config;
  });
};

module.exports = withAndroidQueries;