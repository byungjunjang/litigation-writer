#!/usr/bin/env python3
"""projection JSON 필수 키 검사 (렌더 전 실행).

사용법: python check_projection.py <소장|준비서면> <context.json>
종료코드: 0=OK, 1=FAIL(누락 목록 출력)
"""
import json
import sys

REQUIRED = {
    "소장": {
        "scalar": [
            "원고_성명", "원고_주민번호", "원고_주소", "원고_우편번호",
            "원고_전화", "원고_이메일", "소송대리인", "소송대리인_주소",
            "피고_명칭", "피고_주소", "피고_우편번호", "피고_대표자",
            "사건명", "작성일", "제출법원",
        ],
        "list": {
            "청구취지": None,
            "청구원인": ["번호", "제목", "문단"],
            "입증방법": ["호증", "문서명"],
            "첨부서류": ["명칭", "통수"],
            "확인필요목록": None,
        },
    },
    "준비서면": {
        "scalar": [
            "사건번호", "사건명", "원고_성명", "피고_명칭", "제출자_표시",
            "작성일", "제출자_말미표시", "제출법원_표시",
        ],
        "list": {
            "본문": ["번호", "제목", "문단"],
            "입증방법": ["호증", "문서명"],
            "첨부서류": ["명칭", "통수"],
            "확인필요목록": None,
        },
    },
}


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in REQUIRED:
        sys.exit(__doc__)
    kind, path = sys.argv[1], sys.argv[2]
    with open(path, encoding="utf-8") as f:
        ctx = json.load(f)

    errors = []
    spec = REQUIRED[kind]
    for key in spec["scalar"]:
        value = ctx.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"누락/빈 값: {key}")
    for key, item_keys in spec["list"].items():
        value = ctx.get(key)
        if not isinstance(value, list) or not value:
            errors.append(f"누락/빈 배열: {key}")
            continue
        if item_keys:
            for i, item in enumerate(value):
                if not isinstance(item, dict):
                    errors.append(f"{key}[{i}]가 객체가 아님")
                    continue
                for item_key in item_keys:
                    if item_key not in item:
                        errors.append(f"{key}[{i}]에 {item_key} 없음")

    if errors:
        print("FAIL")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
