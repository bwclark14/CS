#!/usr/bin/env python3
"""Check a Daily Compute story before it is saved as a draft or published.

Usage:
  python3 tools/daily-compute/validate_story.py STORY.json            # a story object, or a draft {"story": {...}}
  python3 tools/daily-compute/validate_story.py stories.json --all    # every story in a stories.json file
  add --legacy to allow older stories that have a single "parsons" and no "extras".

Exits 0 when there are no errors. Warnings are printed but do not fail.
Code activities are checked by RUNNING the pseudocode with pseudo.py (same folder).
"""
import json, re, sys, copy, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pseudo import run

STRANDS = {"Cyber resilience and internet safety", "Searching, processing and managing information responsibly",
           "Using digital products and services in a variety of contexts to achieve a purposeful outcome",
           "Understanding the world through computational thinking", "Understanding and analysing computing technology",
           "Designing, building and testing computing solutions"}
THEMES = {"cyber","robots","hardware","ai","games","internet","data","space","coding","frontier","quantum","ethics","environment"}
CODE_TYPES = {"parsons", "bug", "predict", "complete"}
EXTRA_TYPES = CODE_TYPES | {"binary", "sort", "order", "factop"}
BANNED = ["ARRAY", "OPEN ", "CLOSE ", "READ FROM FILE", "WRITE TO FILE", "PROCEDURE", "FUNCTION", "RETURN", "CREATE FILE"]

def _code(lines): return [l["code"] for l in lines]

def _try(lines, inputs):
    try: return run(lines, inputs)[0]
    except Exception as e: return f"ERROR: {e}"

def check_code_lines(where, lines, err, max_lines=14):
    if not isinstance(lines, list) or not lines: err(f"{where}: needs lines"); return
    if len(lines) > max_lines: err(f"{where}: {len(lines)} lines is too long (max {max_lines})")
    for l in lines:
        if not isinstance(l, dict) or "code" not in l or l.get("indent") not in (0, 1, 2, 3):
            err(f"{where}: each line needs code and indent 0-3"); return
        up = l["code"].upper()
        if any(b in up for b in BANNED) or re.search(r"\w\[", l["code"]):
            err(f"{where}: no arrays, files, procedures or functions allowed: {l['code']}")

def validate(st, legacy=False):
    errors, warnings = [], []
    err, warn = errors.append, warnings.append
    for k in ["id","date","theme","headline","standfirst","body","whyItMatters","keywords","discussion","quiz","sources"]:
        if not st.get(k): err(f"missing {k}")
    if st.get("theme") and st["theme"] not in THEMES: err(f"unknown theme {st['theme']}")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(st.get("date",""))): err("date must be YYYY-MM-DD")
    if "tags" in st and (not isinstance(st["tags"], list) or not all(isinstance(t, str) for t in st["tags"])): err("tags must be a list of strings")
    elif not legacy and not (4 <= len(st.get("tags", [])) <= 6): warn("aim for 4-6 tags")
    if st.get("svg") and (not st["svg"].lstrip().startswith("<svg") or re.search(r"<script|\son\w+\s*=", st["svg"], re.I)): err("unsafe or invalid svg")
    for i, q in enumerate(st.get("quiz", [])):
        if len(q.get("options", [])) != 4: err(f"quiz {i+1}: needs exactly 4 options")
        elif not (isinstance(q.get("answer"), int) and 0 <= q["answer"] < 4): err(f"quiz {i+1}: bad answer index")
        if q.get("strand") not in STRANDS | {"The news"}: err(f"quiz {i+1}: unknown strand {q.get('strand')}")
    c = st.get("connections")
    if c:
        g = c.get("groups", [])
        words = [w for x in g for w in x.get("words", [])]
        if len(g) != 4 or any(len(x.get("words", [])) != 4 for x in g): err("Four Links needs 4 groups of 4")
        elif len({w.lower() for w in words}) != 16: err("Four Links tiles must be 16 different words")
        for w in words:
            parts = w.split()
            if len(parts) > 2 or any(len(p) > 10 for p in parts): err(f"Four Links tile too long: {w}")
    elif not legacy: err("missing connections (Four Links)")

    xs = st.get("extras")
    if not xs:
        if legacy and st.get("parsons"): xs = [{"type": "parsons", **st["parsons"]}]
        else: err("missing extras"); xs = []
    elif st.get("parsons"): warn("story has both parsons and extras; the old parsons field is ignored")
    types = [x.get("type") for x in xs]
    if not legacy or st.get("extras"):
        if not (3 <= len(xs) <= 4): err(f"needs 3 or 4 extras, has {len(xs)}")
        if len(set(types)) != len(types): err("each extra type can only be used once per story")
        if sum(t in CODE_TYPES for t in types) < 2: warn("fewer than 2 code activities: only acceptable when the story genuinely doesn't suit code")
    for x in xs:
        t = x.get("type"); w = f"extra '{t}'"
        if t not in EXTRA_TYPES: err(f"unknown extra type {t}"); continue
        if not x.get("why") and st.get("extras"): err(f"{w}: needs a 'why' (reason it fits the story)")
        if x.get("strand") not in STRANDS: err(f"{w}: strand must be one of the six CfE organisers")
        if t == "parsons":
            check_code_lines(w, x.get("lines"), err, 9)
            ds = x.get("distractors", [])
            if len(ds) != 1: err(f"{w}: needs exactly one distractor")
            elif ds[0]["code"] in _code(x.get("lines", [])): err(f"{w}: distractor is identical to a correct line")
            for alt in x.get("alternatives", []) or []:
                if sorted(alt) != list(range(len(x.get("lines", [])))): err(f"{w}: alternative order must use every line once")
            for tcase in x.get("tests", []) or []:
                out = _try(x["lines"], tcase.get("inputs", []))
                if out != tcase["expect"]: err(f"{w}: solution gives {out}, expected {tcase['expect']}")
        elif t == "predict":
            check_code_lines(w, x.get("lines"), err)
            if len(x.get("options", [])) != 4 or len(set(x.get("options", []))) != 4: err(f"{w}: needs 4 different options")
            else:
                out = _try(x["lines"], x.get("inputs", []))
                if not out or out[-1] != x["options"][x.get("answer", -1)]: err(f"{w}: program displays {out}, but the marked answer is {x['options'][x.get('answer', 0)]}")
            tr = x.get("trace")
            if tr and any(len(r) != len(tr.get("cols", [])) for r in tr.get("rows", [])): err(f"{w}: trace rows must match the columns")
        elif t == "bug":
            check_code_lines(w, x.get("lines"), err)
            b, fx, a, tests = x.get("bug"), x.get("fixes", []), x.get("answer"), x.get("tests", [])
            if not (isinstance(b, int) and 0 <= b < len(x.get("lines", []))): err(f"{w}: bad bug line"); continue
            if len(fx) != 4 or len(set(fx)) != 4 or not (isinstance(a, int) and 0 <= a < 4): err(f"{w}: needs 4 different fixes and an answer"); continue
            if not tests: err(f"{w}: needs tests (inputs + expected output)"); continue
            def passes(code):
                L = copy.deepcopy(x["lines"]); L[b]["code"] = code
                return all(_try(L, t_.get("inputs", [])) == t_["expect"] for t_ in tests)
            if not passes(fx[a]): err(f"{w}: the correct fix does not pass the tests")
            if passes(x["lines"][b]["code"]): err(f"{w}: the buggy program already passes every test, so the tests don't show the bug")
            for k, f in enumerate(fx):
                if k != a and passes(f): err(f"{w}: wrong fix '{f}' also passes the tests")
        elif t == "complete":
            check_code_lines(w, x.get("lines"), err)
            bl, tests = x.get("blanks", []), x.get("tests", [])
            order = [int(n) for l in x.get("lines", []) for n in re.findall(r"\{(\d+)\}", l["code"])]
            if order != list(range(len(bl))) or not (1 <= len(bl) <= 4): err(f"{w}: gaps must be {{0}}, {{1}}... in order, 1-4 gaps"); continue
            if any(len(g.get("options", [])) != 4 or len(set(g["options"])) != 4 or not (0 <= g.get("answer", -1) < 4) for g in bl): err(f"{w}: each gap needs 4 different options and an answer"); continue
            if not tests: err(f"{w}: needs tests"); continue
            def fill(choice):
                L = copy.deepcopy(x["lines"])
                for l in L: l["code"] = re.sub(r"\{(\d+)\}", lambda m: bl[int(m[1])]["options"][choice[int(m[1])]], l["code"])
                return all(_try(L, t_.get("inputs", [])) == t_["expect"] for t_ in tests)
            ans = [g["answer"] for g in bl]
            if not fill(ans): err(f"{w}: the correct answers do not pass the tests")
            for gi, g in enumerate(bl):
                for k in range(4):
                    if k != g["answer"]:
                        ch = ans[:]; ch[gi] = k
                        if fill(ch): err(f"{w}: gap {gi+1} wrong option '{g['options'][k]}' also passes the tests")
        elif t == "binary":
            n = x.get("bits", 8)
            if not (4 <= n <= 10 and isinstance(x.get("target"), int) and 0 < x["target"] < 2 ** n): err(f"{w}: target must fit in {n} bits")
        elif t == "sort":
            B, items = x.get("buckets", ["Input","Process","Output"]), x.get("items", [])
            if not (2 <= len(B) <= 4): err(f"{w}: 2-4 buckets")
            if not (4 <= len(items) <= 8): err(f"{w}: 4-8 items")
            if any(not (0 <= it.get("bucket", -1) < len(B)) for it in items): err(f"{w}: bad bucket index")
            if len({it.get("bucket") for it in items}) < len(B): warn(f"{w}: some buckets have no items")
        elif t == "order":
            if not (4 <= len(x.get("steps", [])) <= 7): err(f"{w}: 4-7 steps")
        elif t == "factop":
            S = x.get("statements", [])
            if not (4 <= len(S) <= 8): err(f"{w}: 4-8 statements")
            if not any(s.get("fact") is True for s in S) or not any(s.get("fact") is False for s in S): err(f"{w}: needs both facts and opinions")
    return errors, warnings

def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    legacy, every = "--legacy" in argv, "--all" in argv
    data = json.load(open(args[0]))
    stories = data["stories"] if every else [data.get("story", data)]
    bad = 0
    for st in stories:
        e, w = validate(st, legacy)
        label = f"{st.get('date','?')} {st.get('headline','')[:50]}"
        for m in w: print(f"WARNING  {label}: {m}")
        for m in e: print(f"ERROR    {label}: {m}")
        if e: bad += 1
        else: print(f"OK       {label}" + (f"  extras: {', '.join(x['type'] for x in st.get('extras', []))}" if st.get("extras") else ""))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
