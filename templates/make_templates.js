// 소장·준비서면 docxtpl 템플릿 생성기 (docx-js)
// 실행: NODE_PATH=$(npm root -g) node make_templates.js
// 산출: 소장_템플릿_docxtpl.docx, 준비서면_템플릿_docxtpl.docx
// 규격: A4, 법원 권장 여백 (상 45mm / 좌우 20mm / 하 30mm — 대한법률구조공단 안내 기준)

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, TabStopType,
} = require("docx");

const FONT = { ascii: "Batang", eastAsia: "Batang", hAnsi: "Batang" };
const MM = 56.6929; // 1mm in DXA
const PAGE = {
  size: { width: 11906, height: 16838 }, // A4
  margin: {
    top: Math.round(45 * MM),    // 2552
    right: Math.round(20 * MM),  // 1134
    bottom: Math.round(30 * MM), // 1701
    left: Math.round(20 * MM),   // 1134
  },
};

// ---- 헬퍼 ----------------------------------------------------------------

// 일반 문단
function P(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align,
    indent: opts.indent,
    pageBreakBefore: opts.pageBreak,
    spacing: { line: 360, before: opts.before ?? 0, after: opts.after ?? 120 },
    tabStops: opts.tabStops,
    children: [new TextRun({ text, font: FONT, size: opts.size ?? 24, bold: opts.bold })],
  });
}

// 문서 표제 ("소        장")
function docTitle(text) {
  return P(text, { align: AlignmentType.CENTER, size: 44, bold: true, before: 0, after: 600 });
}

// 섹션 표제 ("청  구  취  지")
function secTitle(text) {
  return P(text, { align: AlignmentType.CENTER, size: 28, bold: true, before: 480, after: 240 });
}

// docxtpl 루프 태그 전용 문단 ({%p ... %} 는 단독 문단이어야 함)
function tag(text) {
  return new Paragraph({
    spacing: { line: 240, before: 0, after: 0 },
    children: [new TextRun({ text, font: FONT, size: 16, color: "AAAAAA" })],
  });
}

// 당사자 블록: 라벨 줄 + 들여쓴 상세 줄
const HANG = 2000; // 상세 줄 들여쓰기 (DXA)
function partyLine(text) {
  return P(text, { after: 60 });
}
function partyDetail(text) {
  return P(text, { indent: { left: HANG }, after: 60 });
}

// 별첨: 변호사 확인 필요 사항 (새 페이지, 제출 전 삭제 대상)
function appendix() {
  return [
    P("별첨 — 변호사 확인 필요 사항", {
      align: AlignmentType.CENTER, size: 28, bold: true, pageBreak: true, after: 120,
    }),
    P("(내부 검토용 — 아래 사항을 확인·정리한 뒤 본 별첨 페이지를 삭제하고 제출)", {
      align: AlignmentType.CENTER, size: 20, after: 360,
    }),
    tag("{%p for 항목 in 확인필요목록 %}"),
    P("{{ loop.index }}. {{ 항목 }}", { indent: { left: 400 } }),
    tag("{%p endfor %}"),
    P("공통 점검", { bold: true, before: 360 }),
    P("□ 본문 파란색 [변호사 확인 필요 …] 표시를 모두 확정하고 표시 문구 제거", { indent: { left: 400 } }),
    P("□ 빨간색 [출처: …] 핀 전체 삭제 (검증 추적용 — 제출본에는 미기재)", { indent: { left: 400 } }),
    P("□ 하단 푸터의 \"[초안] — 변호사 검수 전 제출 금지\" 문구 삭제", { indent: { left: 400 } }),
    P("□ 산출물 폴더의 검증보고(⚠️ 항목) 확인", { indent: { left: 400 } }),
    P("□ 본 별첨 페이지 삭제", { indent: { left: 400 } }),
  ];
}

function buildDoc(children) {
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [{
      properties: { page: PAGE },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: "[초안] — 변호사 검수 전 제출 금지",
              font: FONT, size: 14, color: "999999",
            })],
          })],
        }),
      },
      children,
    }],
  });
}

// ---- 소장 템플릿 ----------------------------------------------------------

const sojang = buildDoc([
  docTitle("소        장"),

  partyLine("원    고    {{원고_성명}} ({{원고_주민번호}})"),
  partyDetail("{{원고_주소}} (우 : {{원고_우편번호}})"),
  partyDetail("전화번호 : {{원고_전화}}, 전자우편 : {{원고_이메일}}"),
  partyDetail("소송대리인 {{소송대리인}}"),
  partyDetail("{{소송대리인_주소}}"),
  P("", { after: 120 }),
  partyLine("피    고    {{피고_명칭}}"),
  partyDetail("{{피고_주소}} (우 : {{피고_우편번호}})"),
  partyDetail("대표이사 {{피고_대표자}}"),
  P("", { after: 120 }),

  P("{{사건명}}", { bold: true, before: 240, after: 120 }),

  secTitle("청  구  취  지"),
  tag("{%p for 항 in 청구취지 %}"),
  P("{{ loop.index }}. {{ 항 }}"),
  tag("{%p endfor %}"),
  P("라는 판결을 구합니다."),

  secTitle("청  구  원  인"),
  tag("{%p for 절 in 청구원인 %}"),
  P("{{ 절.번호 }}. {{ 절.제목 }}", { bold: true, before: 240 }),
  tag("{%p for 문단 in 절.문단 %}"),
  P("{{ 문단 }}", { indent: { left: 400 } }),
  tag("{%p endfor %}"),
  tag("{%p endfor %}"),

  secTitle("입  증  방  법"),
  tag("{%p for 증 in 입증방법 %}"),
  P("1. {{ 증.호증 }}\t{{ 증.문서명 }}", {
    tabStops: [{ type: TabStopType.LEFT, position: 3600 }],
  }),
  tag("{%p endfor %}"),

  secTitle("첨  부  서  류"),
  tag("{%p for 서류 in 첨부서류 %}"),
  P("1. {{ 서류.명칭 }}\t{{ 서류.통수 }}", {
    tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
  }),
  tag("{%p endfor %}"),

  P("{{작성일}}", { align: AlignmentType.CENTER, before: 480, after: 240 }),
  P("원고 소송대리인 {{소송대리인}}  (인)", { align: AlignmentType.RIGHT, after: 480 }),
  P("{{제출법원}}  귀중", { size: 32, bold: true, before: 240 }),
  ...appendix(),
]);

// ---- 준비서면 템플릿 -------------------------------------------------------

const junbi = buildDoc([
  docTitle("준  비  서  면"),

  partyLine("사    건    {{사건번호}}  {{사건명}}"),
  P("", { after: 60 }),
  partyLine("원    고    {{원고_성명}}"),
  P("", { after: 60 }),
  partyLine("피    고    {{피고_명칭}}"),
  P("", { after: 240 }),

  P("위 사건에 관하여 {{제출자_표시}}는 다음과 같이 변론을 준비합니다.", { before: 120, after: 240 }),

  secTitle("다        음"),
  tag("{%p for 절 in 본문 %}"),
  P("{{ 절.번호 }}. {{ 절.제목 }}", { bold: true, before: 240 }),
  tag("{%p for 문단 in 절.문단 %}"),
  P("{{ 문단 }}", { indent: { left: 400 } }),
  tag("{%p endfor %}"),
  tag("{%p endfor %}"),

  secTitle("입  증  방  법"),
  tag("{%p for 증 in 입증방법 %}"),
  P("1. {{ 증.호증 }}\t{{ 증.문서명 }}", {
    tabStops: [{ type: TabStopType.LEFT, position: 3600 }],
  }),
  tag("{%p endfor %}"),

  secTitle("첨  부  서  류"),
  tag("{%p for 서류 in 첨부서류 %}"),
  P("1. {{ 서류.명칭 }}\t{{ 서류.통수 }}", {
    tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
  }),
  tag("{%p endfor %}"),

  P("{{작성일}}", { align: AlignmentType.CENTER, before: 480, after: 240 }),
  P("{{제출자_말미표시}}  (인)", { align: AlignmentType.RIGHT, after: 480 }),
  P("{{제출법원_표시}}  귀중", { size: 32, bold: true, before: 240 }),
  ...appendix(),
]);

// ---- 저장 -----------------------------------------------------------------

Promise.all([
  Packer.toBuffer(sojang).then(b => fs.writeFileSync(__dirname + "/소장_템플릿_docxtpl.docx", b)),
  Packer.toBuffer(junbi).then(b => fs.writeFileSync(__dirname + "/준비서면_템플릿_docxtpl.docx", b)),
]).then(() => console.log("템플릿 2종 생성 완료"));
