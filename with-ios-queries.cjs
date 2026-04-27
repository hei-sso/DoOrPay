// Adapted from expo-tosspayments-webview (MIT License)
// https://github.com/gs0428/expo-tosspayments-webview

const { withInfoPlist } = require("@expo/config-plugins");

// iOS에 주입할 앱스킴 목록 (토스페이먼츠 문서 기준)
const QUERY_SCHEMES = [
  "supertoss", // 토스페이
  "kb-acp", // 국민카드
  "liivbank", // 국민카드
  "newliiv", // 국민카드
  "kbbank", // 국민카드
  "nhappcardansimclick", // 농협카드
  "nhallonepayansimclick", // 농협카드
  "nonghyupcardansimclick", // 농협카드
  "lottesmartpay", // 롯데카드
  "lotteappcard", // 롯데카드
  "mpocket.online.ansimclick", // 삼성카드
  "ansimclickscard", // 삼성카드
  "tswansimclick", // 삼성카드
  "ansimclickipcollect", // 삼성카드
  "vguardstart", // 삼성카드
  "samsungpay", // 삼성카드
  "scardcertiapp", // 삼성카드
  "shinhan-sr-ansimclick", // 신한카드
  "smshinhanansimclick", // 신한카드
  "com.wooricard.wcard", // 우리카드
  "newsmartpib", // 우리카드
  "citispay", // 씨티카드
  "citicardappkr", // 씨티카드
  "citimobileapp", // 씨티카드
  "cloudpay", // 하나카드
  "hanawalletmembers", // 하나카드
  "hdcardappcardansimclick", // 현대카드
  "smhyundaiansimclick", // 현대카드
  "shinsegaeeasypayment", // 간편결제
  "payco", // 간편결제
  "lpayapp", // 간편결제
  "ispmobile", // ISP(BC/국민)
  "tauthlink", // 본인인증
  "ktauthexternalcall", // 본인인증
  "upluscorporation", // 본인인증
  "kftc-bankpay", // 뱅크페이
  "kakaotalk", // 카카오톡
  "wooripay", // 우리페이
  "lmslpay", // 간편결제
  "naversearchthirdlogin", // 네이버
  "hanaskcardmobileportal", // 하나카드
  "kb-bankpay", // KB 뱅크페이
  "kakaobank", // 카카오뱅크
  "monimopay", // 삼성카드
  "monimopayauth", // 삼성카드
];

// Info.plist에 LSApplicationQueriesSchemes를 추가하는 함수
function addQueriesToInfoPlist(infoPlist) {
  // 기존 LSApplicationQueriesSchemes가 있는지 확인
  const existingSchemes = infoPlist.LSApplicationQueriesSchemes || [];

  // 기존 스킴을 Set으로 변환하여 중복 제거
  const existingSchemesSet = new Set(existingSchemes);

  // 새로운 스킴 추가 (중복 제거)
  const newSchemes = QUERY_SCHEMES.filter((scheme) => !existingSchemesSet.has(scheme));

  if (newSchemes.length > 0) {
    infoPlist.LSApplicationQueriesSchemes = [...existingSchemes, ...newSchemes];
  } else if (!infoPlist.LSApplicationQueriesSchemes) {
    // 기존 스킴이 없으면 새로 생성
    infoPlist.LSApplicationQueriesSchemes = QUERY_SCHEMES;
  }

  return infoPlist;
}

// iOS queries 플러그인
const withIosQueries = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults = addQueriesToInfoPlist(config.modResults);
    return config;
  });
};

module.exports = withIosQueries;