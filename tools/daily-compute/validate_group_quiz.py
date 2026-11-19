#!/usr/bin/env python3
"""Check a Daily Compute group quiz question file (daily-compute/group-quiz/<story-id>.json).

Usage:
  python3 tools/daily-compute/validate_group_quiz.py daily-compute/group-quiz/2026-11-16-bebras-challenge.json
  python3 tools/daily-compute/validate_group_quiz.py --all      # every file in daily-compute/group-quiz/
  add --stories PATH to check against a different stories.json (default: daily-compute/stories.json).

Exits 0 when there are no errors. Warnings are printed but do not fail.
Every code question is RUN with pseudo.py (same folder), so a wrong answer key is caught:
  count      "match": the display line to count; the marked option must be how many times it is displayed
  trace      the marked option must be what is displayed (several lines joined with " / "),
             or, with "variable", that variable's value at the end
  truefalse  "condition": the condition to test after the code runs; options must be exactly ["TRUE","FALSE"]
  testdata   optional "range": [low, high] plus either "value" (options are Normal/Boundary/Exceptional)
             or "kind" (the options are values and exactly one is that kind)
Code questions that RECEIVE input need "inputs".
"""
import json, re, sys, os, glob, difflib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pseudo import run, _fmt
from validate_story import check_code_lines

ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
QDIR = os.path.join(ROOT, "daily-compute", "group-quiz")
STORIES = os.path.join(ROOT, "daily-compute", "stories.json")
TYPES = {"identify", "count", "truefalse", "trace", "testdata", "ct", "poll"}
FOUR = {"identify", "count", "trace", "ct"}          # these always have 4 options
KINDS = ["Normal", "Boundary", "Exceptional"]
KEYWORDS = r"(SET|TO|RECEIVE|FROM|KEYBOARD|SEND|DISPLAY|IF|THEN|ELSE|END|WHILE|DO|REPEAT|TIMES|UNTIL|AND|OR|NOT|TRUE|FALSE)"
OPENERS = re.compile(r"^(IF .* THEN|WHILE .* DO|REPEAT .* TIMES|REPEAT)$")
CLOSERS = re.compile(r"^(END IF|END WHILE|END REPEAT|UNTIL .*)$")

def norm(t): return re.sub(r"[^a-z0-9 ]", "", str(t).lower()).strip()

def check_indent(where, lines, err):
    depth = 0
    for n, l in enumerate(lines, 1):
        c = l["code"].strip()
        if CLOSERS.match(c) or c == "ELSE": depth -= 1
        if l["indent"] != depth: err(f"{where}: line {n} '{c}' should have indent {max(depth, 0)}, has {l['indent']}"); return
        if OPENERS.match(c) or c == "ELSE": depth += 1
    if depth != 0: err(f"{where}: a block is not closed (END IF / END WHILE / END REPEAT / UNTIL)")

def check_keywords(where, lines, err):
    for l in lines:
        bare = re.sub(r'"[^"]*"', '""', l["code"])
        low = re.search(r"\b" + KEYWORDS.lower().replace("|", r"\b|\b") + r"\b", bare)
        if low: err(f"{where}: keywords must be in CAPITALS: {l['code']}")

def classify(v, lo, hi):
    try: x = float(v)
    except (TypeError, ValueError): return "Exceptional"
    if x < lo or x > hi: return "Exceptional"
    return "Boundary" if x in (lo, hi) else "Normal"

def validate(data, stories, fname=None):
    errors, warnings = [], []
    err, warn = errors.append, warnings.append
    sid = data.get("storyId")
    if not isinstance(sid, str) or not sid: err("missing storyId"); return errors, warnings
    if fname and os.path.basename(fname) != sid + ".json": err(f"file must be named {sid}.json")
    story = stories.get(sid)
    if not story: err(f"no story with id {sid} in stories.json")
    if not isinstance(data.get("title"), str) or not data["title"].strip(): err("missing title")
    rounds = data.get("rounds")
    if not isinstance(rounds, list) or not (1 <= len(rounds) <= 5): err("rounds must be a list of 1-5 rounds"); return errors, warnings
    qs = []
    for r, rd in enumerate(rounds, 1):
        if not isinstance(rd.get("name"), str) or not rd["name"].strip(): err(f"round {r}: needs a name")
        if not isinstance(rd.get("questions"), list) or not rd["questions"]: err(f"round {r}: needs questions"); continue
        qs += [(f"round {r} question {k}", q) for k, q in enumerate(rd["questions"], 1)]
    if not (10 <= len(qs) <= 16): err(f"needs 10-16 questions, has {len(qs)}")

    # Things the group quiz must not repeat: the story's own quiz, extras and Four Links
    old_q = [q.get("q", "") for q in (story or {}).get("quiz", [])]
    old_titles = [x.get("title", "") for x in (story or {}).get("extras", [])]
    old_code = [[l["code"].strip() for l in x["lines"]] for x in (story or {}).get("extras", []) if x.get("lines")]
    links = {w.lower() for g in (story or {}).get("connections", {}).get("groups", []) for w in g.get("words", [])}

    seen = []
    for w, q in qs:
        t = q.get("type")
        if t not in TYPES: err(f"{w}: unknown type {t}"); continue
        text = q.get("q")
        if not isinstance(text, str) or not text.strip(): err(f"{w}: missing question text"); continue
        if len(text) > 220: err(f"{w}: question is too long for the board ({len(text)} characters, max 220)")
        for o in old_q + old_titles:
            if o and (norm(o) == norm(text) or difflib.SequenceMatcher(None, norm(o), norm(text)).ratio() > 0.8):
                err(f"{w}: repeats the story's own quiz or activity: '{o}'")
        if norm(text) in seen: err(f"{w}: same question text as an earlier question")
        seen.append(norm(text))
        opts = q.get("options")
        if not isinstance(opts, list) or not all(isinstance(o, str) and o.strip() for o in opts): err(f"{w}: options must be a list of text"); continue
        if not (2 <= len(opts) <= 4): err(f"{w}: needs 2-4 options")
        if t in FOUR and len(opts) != 4: err(f"{w}: {t} questions need exactly 4 options")
        if t == "truefalse" and opts != ["TRUE", "FALSE"]: err(f'{w}: true/false options must be exactly ["TRUE", "FALSE"]')
        if t == "testdata" and len(opts) not in (3, 4): err(f"{w}: test data questions need 3 or 4 options")
        if len({o.strip().lower() for o in opts}) != len(opts): err(f"{w}: two options are the same")
        if any(len(o) > 90 for o in opts): err(f"{w}: an option is too long for a button (max 90 characters)")
        if t == "ct" and len({o.lower() for o in opts} & links) >= 3: warn(f"{w}: options look like the story's Four Links words")
        a = q.get("answer")
        if t == "poll":
            if "answer" in q: err(f"{w}: a poll has no correct answer, so leave out 'answer'")
        elif not (isinstance(a, int) and not isinstance(a, bool) and 0 <= a < len(opts)): err(f"{w}: bad answer index {a}"); continue
        ex = q.get("explain")
        if not isinstance(ex, str) or not ex.strip(): err(f"{w}: needs a one-sentence explain")
        elif len(re.findall(r"(?<!\.)[.!?](\s|$)", ex.replace("...", "").strip())) > 1: warn(f"{w}: explain should be one sentence")
        elif len(ex) > 260: warn(f"{w}: explain is long for the board ({len(ex)} characters)")

        code = q.get("code")
        if code is None:
            if t in ("count", "trace", "truefalse"): err(f"{w}: {t} questions need code")
            continue
        check_code_lines(w, code, err, 12)
        if not isinstance(code, list) or not all(isinstance(l, dict) and "code" in l and l.get("indent") in (0, 1, 2, 3) for l in code): continue
        check_indent(w, code, err)
        check_keywords(w, code, err)
        cl = [l["code"].strip() for l in code]
        if cl in old_code: err(f"{w}: uses exactly the same code as one of the story's activities")
        inputs = q.get("inputs", [])
        if any(re.match(r"^RECEIVE ", c) for c in cl) and not inputs: err(f"{w}: code receives input, so add 'inputs' to run it with"); continue
        try: out, env = run(code, inputs)
        except Exception as e: err(f"{w}: the code does not run: {e}"); continue
        if t == "poll": continue
        right = opts[a]
        if t == "count":
            m = q.get("match")
            if not isinstance(m, str) or not m: err(f"{w}: count questions need 'match' (the line that is displayed)"); continue
            n = sum(1 for o in out if o == m)
            if n == 0: err(f"{w}: '{m}' is never displayed")
            if right != str(n): err(f"{w}: '{m}' is displayed {n} times, but the marked answer is {right}")
        elif t == "trace":
            v = q.get("variable")
            if v:
                if v not in env: err(f"{w}: there is no variable '{v}'"); continue
                got = _fmt(env[v])
            else:
                if not out: err(f"{w}: the program displays nothing"); continue
                got = " / ".join(out)
            if right != got: err(f"{w}: the program gives '{got}', but the marked answer is '{right}'")
            for k, o in enumerate(opts):
                if k != a and o == got: err(f"{w}: wrong option '{o}' is also what the program gives")
        elif t == "truefalse":
            c = q.get("condition")
            if not isinstance(c, str) or not c: err(f"{w}: true/false questions need 'condition'"); continue
            if c not in text: warn(f"{w}: the question text should show the condition '{c}'")
            try: res = run(code + [{"code": f"SEND ({c}) TO DISPLAY", "indent": 0}], inputs)[0][-1]
            except Exception as e: err(f"{w}: the condition does not run: {e}"); continue
            if res not in ("TRUE", "FALSE"): err(f"{w}: the condition gives {res}, not TRUE or FALSE")
            elif right != res: err(f"{w}: the condition is {res}, but the marked answer is {right}")
        elif t == "identify" and any(re.match(r"^Line \d+", o) for o in opts):
            for o in opts:
                m = re.match(r"^Line (\d+)", o)
                if m and not (1 <= int(m[1]) <= len(code)): err(f"{w}: option '{o}' points past the end of the code")

    for w, q in qs:   # test data without code
        if q.get("type") == "testdata" and q.get("range") and isinstance(q.get("answer"), int):
            lo, hi = q["range"]; opts = q["options"]
            if "value" in q:
                if set(opts) - set(KINDS): err(f"{w}: with 'value', options must be from {KINDS}")
                elif opts[q["answer"]] != classify(q["value"], lo, hi): err(f"{w}: {q['value']} is {classify(q['value'], lo, hi)} data, but the marked answer is {opts[q['answer']]}")
            elif q.get("kind") in KINDS:
                kinds = [classify(o, lo, hi) for o in opts]
                if kinds[q["answer"]] != q["kind"]: err(f"{w}: the marked answer {opts[q['answer']]} is {kinds[q['answer']]} data, not {q['kind']}")
                if kinds.count(q["kind"]) != 1: err(f"{w}: {kinds.count(q['kind'])} options are {q['kind']} data; there must be exactly one")
            else: err(f"{w}: with 'range', add 'value' or 'kind'")

    polls = sum(q.get("type") == "poll" for _, q in qs)
    if polls > 2: err(f"at most 2 polls, has {polls}")
    if sum("code" in q for _, q in qs) < len(qs) // 2: warn("fewer than half the questions have code to read")
    return errors, warnings

def main(argv):
    sp = STORIES
    if "--stories" in argv: sp = argv[argv.index("--stories") + 1]
    args = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--stories")]
    stories = {s["id"]: s for s in json.load(open(sp, encoding="utf-8"))["stories"]}
    files = sorted(glob.glob(os.path.join(QDIR, "*.json"))) if "--all" in argv else args
    if not files: print(__doc__); return 2
    bad = 0
    for f in files:
        try: data = json.load(open(f, encoding="utf-8"))
        except Exception as e: print(f"ERROR    {f}: not valid JSON: {e}"); bad += 1; continue
        e, w = validate(data, stories, f)
        label = os.path.basename(f)
        for m in w: print(f"WARNING  {label}: {m}")
        for m in e: print(f"ERROR    {label}: {m}")
        if e: bad += 1
        else: print(f"OK       {label}  {sum(len(r['questions']) for r in data['rounds'])} questions in {len(data['rounds'])} rounds")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
