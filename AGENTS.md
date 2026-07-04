# AGENTS.md — Codex 실행 규칙 (송무서면 생성기)

이 저장소는 **듀얼 호스트**다: Claude Code와 Codex(CLI/cloud/web).
Claude Code는 `.claude/skills/`를 Skill 런타임으로 로드한다. Codex에는 스킬
런타임이 없으므로, 이 파일이 Codex가 같은 절차를 즉흥 없이 그대로 실행하도록
강제한다.

`CLAUDE.md`가 프로젝트 SSOT다(디렉토리 지도, 워크플로우, **절대 안전수칙 5조**,
골든 케이스 회귀 점검). 반드시 먼저 읽어라. 아래 규칙은 그 위에 Codex 측
집행 규칙을 얹은 것이다.

> ⚠️ **모든 산출물은 초안이며, 변호사 검수 전 제출 금지.** 이 문장은 어떤
> 경우에도 생략·완화하지 않는다.

## 스킬 소스 (생성된 미러)

- **`.claude/skills/`가 canonical, `.codex/skills/`는 생성된 미러다** —
  텍스트 파일 안의 `.claude/skills` 경로 토큰이 `.codex/skills`로 치환된 것
  외에는 바이트 동일하며, 미러 루트에 생성 마커(`_GENERATED.md`)가 있다.
- **`.codex/skills/`를 직접 수정하지 마라.** `.claude/skills/`를 고친 뒤
  `python scripts/sync_codex_mirror.py` 로 재생성한다.
  (`--check` 옵션은 미러가 낡았으면 exit 1.)

## 서면 요청 — 필수 절차

사용자가 사건 작업을 요청하면("새 사건", "소장 써줘", "리서치", "준비서면",
"검증", 또는 `/case-intake` 류 슬래시 표기) 해당 SKILL.md를 찾아
**단계별로 그대로 실행한다.** 요약해서 즉흥 실행하는 것 금지.

| 요청 | 실행할 절차 | 산출물 |
|---|---|---|
| 새 사건 등록, 상담메모 정리 | `.codex/skills/case-intake/SKILL.md` | `cases/{사건}/사건컨텍스트.json` |
| 법령·판례 리서치 | `.codex/skills/legal-research/SKILL.md` | `리서치/쟁점별_법리.md` |
| 소장 초안 | `.codex/skills/draft-complaint/SKILL.md` | `산출물/소장_초안.docx` |
| 준비서면 초안 (상대 서면 도착 시) | `.codex/skills/draft-brief/SKILL.md` | `산출물/준비서면_초안.docx` |
| 인용 검증 | `.codex/skills/verify-citations/SKILL.md` | `산출물/검증보고_{서면}.md` |

순서 강제: case-intake → (검수) → legal-research → (검수) → draft-complaint →
verify-citations → 변호사 최종 검수. 상대 답변서 도착 시 같은 사건 폴더에서
draft-brief → verify-citations. **각 단계 사이에 변호사가 산출 파일을 직접
검수한다 — 단계를 묶어서 한 번에 진행하라는 명시 지시가 없는 한 단계마다
멈추고 검수를 안내한다.**

## Codex 측 치환 규칙

SKILL.md는 Claude Code 도구명으로 쓰여 있다. Codex에서는 다음으로 치환한다:

| SKILL.md 표기 | Codex에서 할 일 |
|---|---|
| `Read` | 파일을 직접 읽는다 (shell `cat`/뷰어). **읽지 않은 조문·판례 인용 금지는 동일.** |
| `Grep` / `Glob` | `rg` / `rg --files`(또는 `find`)로 검색 |
| `AskUserQuestion` | 대화창에서 사용자에게 직접 질문하고 답을 기다린다 |
| `Agent` 도구(서브에이전트) | 아래 "인용 검증의 독립성" 절 참조 |

- verify-citations 프롬프트의 작업 디렉토리 절대경로는 **현재 체크아웃된
  저장소 루트로 치환**해 사용한다.
- SKILL.md의 `search_law`/`get_law_text`/`search_decisions`/`get_decision_text`/
  `legal_analysis` 등 **korean-law MCP 도구는 Codex에서도 그대로 호출**한다
  (Codex는 MCP 네이티브 지원). 별도 치환 불필요 — 아래 "환경 준비"의 MCP 등록 필요.
- 모든 파일은 UTF-8로 읽고 쓴다(한국어 파일명·내용).

## 인용 검증의 독립성 (verify-citations)

Claude Code에서는 새 컨텍스트의 서브에이전트가 검증한다. Codex에 동등한
서브에이전트가 없으면 다음을 지킨다:

1. 가능하면 **새 세션/새 대화**에서 verify-citations의 서브에이전트 프롬프트를
   그대로 실행하는 것이 최선이다.
2. 같은 세션에서 수행해야 한다면: **작성 시 사용한 어떤 기억·요약도 근거로
   삼지 말고**, 모든 인용을 korean-law-mcp로 처음부터 다시 조회해 리서치 파일의
   동결 발췌(및 입력 자료)와 대조한다. 리서치 파일의
   `[cite_check: …]`·`[행위시 확인: …]` 라인도 신뢰하지 않고 재수행한다.
3. ❌가 하나라도 있으면 해당 서면은 **"제출 금지"** 상태다. 수정 후 재검증.

## 절대 안전수칙 (CLAUDE.md 미러 — 협상 불가)

1. **사실 생성 금지** — 입력 자료에 없는 사실·수치·날짜를 만들지 않는다.
   모든 사실관계 항목에 `근거` 필수.
2. **인용 단일 진입로** — 조문·판례 인용은 `리서치/쟁점별_법리.md`에 원문
   발췌가 있는 것만. 즉석 인용 금지. 규칙: `rules/인용규칙.md`.
3. **모르면 확인필요** — 불확실한 값(이율·관할·기간 등)은 추측하지 않고
   사건컨텍스트 `확인필요`에 적재 + 본문 `[변호사 확인 필요]` 표기.
4. **검증 게이트** — 검증보고에 ❌ 1건 이상이면 "제출 금지". 수정 후 재검증.
5. **렌더 전 키 검사** — `render_서면.py` 실행 전 반드시
   `python "templates/check_projection.py" <소장|준비서면> <context.json>` 으로
   `OK` 확인. 실패 시 JSON을 고치고 재시도 — 검사를 건너뛰고 렌더하지 않는다.

웹 검색으로 법령·판례를 가져와 인용하는 것도 금지다. 인용 가능한 원천은
korean-law-mcp(국가법령정보센터) → 리서치 발췌 경로뿐이다.

## 환경 준비 (최초 1회)

- `pip install docxtpl` (렌더에 필요. 실패 환경이면 docx 렌더 단계에서 HALT하고
  보고 — 텍스트로 대충 만들어 docx인 척 하지 않는다.)
- **korean-law-mcp 연결.** 법령·판례 출처는 korean-law-mcp(국가법령정보센터
  Open API)다. `npm install -g korean-law-mcp` 후 Codex MCP 설정에
  `korean-law` 서버(`command = "korean-law-mcp"`)를 등록하고, 무료 API 키를
  `open.law.go.kr`에서 발급받아 `LAW_OC` 환경변수(또는 저장소 루트 `.env`)로
  주입한다. **키는 커밋하지 않는다.**
- MCP가 연결되지 않았거나 API 키가 없으면 리서치·검증 단계는 진행 불가다.
  HALT하고 사유를 보고한다 — 기억·웹검색으로 대체하지 않는다.

## 시니어 변호사 송무 조언 (대화창 전용)

절차 마지막(verify-citations 보고 직후)에 시니어 변호사 관점의 송무 진행
조언을 **대화창에만 출력**한다. **어떤 파일에도 기록 금지** — 산출물·리서치·
사건컨텍스트·검증보고에 섞이면 안 된다. 세부 규칙은
`.codex/skills/verify-citations/SKILL.md`의 해당 절.

## 회귀 점검 · 미러 신선도

- `rules/` 또는 `.claude/skills/`를 변경하면 골든 케이스
  (`cases/2026_김민재 해고 무효`)로 영향 단계만 재실행해 확인한다
  (CLAUDE.md "회귀 점검" 절: ① 검증 PASS/FAIL 불변 ② 사건컨텍스트 멱등
  ③ 새 산출 형식 정상). 골든 케이스 폴더는 삭제·임의 수정 금지.
- 스킬을 변경했으면 커밋 전에 `python scripts/sync_codex_mirror.py` 를 돌려
  미러를 함께 갱신한다. `--check`가 exit 1이면 미러가 낡은 것이다.
