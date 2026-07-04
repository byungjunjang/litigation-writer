# 송무서면 생성기

변호사 1인이 실제 민사사건의 소장·준비서면 초안 DOCX를 만드는 작업공간.
**모든 산출물은 초안이며, 변호사 검수 전 제출 금지.**

## 디렉토리 지도

- `cases/{연도_의뢰인_사건요지}/` — 사건 단위 작업 폴더 (입력/, 사건컨텍스트.json, 리서치/, 산출물/)
- `rules/인용규칙.md` — 조문·판례 인용 표기 + 출처 핀 규칙 (모든 인용에 적용)
- `rules/사건컨텍스트.schema.json` — canonical 사건컨텍스트 스키마
- `templates/` — docxtpl 템플릿 2종(소장_템플릿_docxtpl.docx, 준비서면_템플릿_docxtpl.docx), render_서면.py, check_projection.py
- `.mcp.json` — korean-law-mcp(법령·판례·행정규칙·자치법규·조약·해석례) 등록
- `docs/superpowers/` — superpowers 산출물 전부: 설계(specs)·계획(plans)·
  실행로그(execution)·핸드오프(handoffs)·SDD 작업파일(sdd: 진행 레저·태스크
  브리프/리포트·리뷰 패키지). **루트에 별도 `.superpowers/` 폴더를 만들지
  않는다** — 스킬 기본 경로 대신 이 폴더를 쓴다.

법령·판례 출처는 korean-law-mcp(국가법령정보센터 Open API)다. 구 git 저장소(legalize-kr/precedent-kr) 대조 방식은 2026-07 폐지했다.

## 듀얼 호스트 (Claude Code + Codex)

이 저장소는 Codex에서도 동작한다 — Codex 진입점은 루트 `AGENTS.md`.
**`.claude/skills/`가 canonical이고 `.codex/skills/`는 생성된 미러다.**
미러를 직접 수정하지 말 것. `.claude/skills/`를 변경하면 커밋 전에
`python scripts/sync_codex_mirror.py` 로 미러를 재생성한다
(`--check`: 낡았으면 exit 1).

## 워크플로우 (스킬 5종)

/case-intake → (검수) → /legal-research → (검수) → /draft-complaint → /verify-citations → 변호사 최종 검수
상대 답변서 도착 시 같은 사건 폴더에서 → /draft-brief → /verify-citations

각 단계 사이에 변호사가 산출 파일을 직접 검수·수정한 뒤 다음 단계로 진행한다.

절차 마지막(/verify-citations 보고 직후)에는 사건 담당 변호사가 참고할
시니어 변호사의 송무 진행 조언을 **대화창에만 출력**한다 — 어떤 문서 파일에도
기록하지 않는다(전략 메모가 산출물·검증 라인에 섞이는 것 방지).
세부 규칙은 verify-citations 스킬의 "시니어 변호사 송무 조언" 절 참조.

## 절대 안전수칙 (모든 작업에 적용)

1. **사실 생성 금지** — 입력 자료에 없는 사실·수치·날짜를 만들지 않는다.
   모든 사실관계 항목에는 `근거`(입력 파일 출처/증거 표시)가 있어야 한다.
   부존재·부작위의 단정도 사실 생성이다 — 입력이 명시적으로 뒷받침하지
   않으면 단정하지 않고 완화 어투 + `확인필요`로 기재한다.
2. **인용 단일 진입로** — 조문·판례 인용은 `리서치/쟁점별_법리.md`에 원문 발췌가
   있는 것만 가능. 즉석 인용 금지. 규칙은 `rules/인용규칙.md`.
3. **모르면 확인필요** — 불확실한 값(이율·관할·기간 등)은 추측하지 않고
   사건컨텍스트 `확인필요`에 적재하고 본문에 `[변호사 확인 필요]` 표기.
4. **검증 게이트** — /verify-citations에서 ❌가 하나라도 있으면 해당 서면은
   "제출 금지" 상태. 수정 후 재검증.
5. **렌더 전 키 검사** — render_서면.py 실행 전 반드시
   `python "templates/check_projection.py" <소장|준비서면> <context.json>` 으로 OK 확인.

## 회귀 점검 (rules/·스킬 변경 시)

골든 케이스: `cases/2026_김민재 해고 무효`. `rules/` 또는 `.claude/skills/`를
변경하면 영향받는 단계만 서브에이전트로 골든 케이스에 재실행해 확인한다:
① 검증보고 PASS/FAIL이 변경 전과 달라지지 않음 ② 사건컨텍스트 멱등(쟁점·
사실관계 불변) ③ 새 산출 형식이 정상 생성됨. 자동화 스크립트는 두지 않는다.

## 자주 쓰는 명령

- 행위시법: 인용규칙 §7(`applicable_law`).
- 렌더·현행성 명령은 각 스킬에, 템플릿 재생성은 `templates/README.md`에 기재.
