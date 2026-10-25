"""Tiny interpreter for the Daily Compute pseudocode subset (SQA-style reference language).
Supports SET, RECEIVE x FROM ..., SEND e TO DISPLAY, IF/ELSE/END IF, WHILE/END WHILE,
REPEAT n TIMES/END REPEAT, REPEAT/UNTIL, & for joining text, AND/OR/NOT, = <> < > <= >=."""
import re

class Loop(Exception): pass

def _split_amp(e):
    parts, cur, q = [], "", False
    for ch in e:
        if ch == '"': q = not q
        if ch == "&" and not q: parts.append(cur); cur = ""
        else: cur += ch
    parts.append(cur); return [p.strip() for p in parts]

def _py(e):
    out, q, i = "", False, 0
    while i < len(e):
        ch = e[i]
        if ch == '"': q = not q; out += ch; i += 1; continue
        if q: out += ch; i += 1; continue
        if e.startswith("<>", i): out += "!="; i += 2; continue
        if e.startswith("<=", i) or e.startswith(">=", i) or e.startswith("!=", i): out += e[i:i+2]; i += 2; continue
        if ch == "=": out += "=="; i += 1; continue
        out += ch; i += 1
    out = re.sub(r"\bAND\b", " and ", out); out = re.sub(r"\bOR\b", " or ", out); out = re.sub(r"\bNOT\b", " not ", out)
    out = re.sub(r"\bTRUE\b", "True", out); out = re.sub(r"\bFALSE\b", "False", out)
    return out

def _fmt(v):
    if isinstance(v, bool): return "TRUE" if v else "FALSE"
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)

def run(lines, inputs=(), max_steps=10000):
    code = [(l["code"] if isinstance(l, dict) else l).strip() for l in lines]
    env, out, inp, steps = {}, [], list(inputs), [0]
    def ev(e):
        parts = _split_amp(e)
        vals = [eval(_py(p), {"__builtins__": {}}, env) for p in parts]
        return "".join(_fmt(v) for v in vals) if len(parts) > 1 else vals[0]
    def find_end(i, opener, closers):
        depth = 0
        for j in range(i + 1, len(code)):
            c = code[j]
            if re.match(r"^(IF .* THEN|WHILE .* DO|REPEAT .* TIMES|REPEAT)$", c): depth += 1
            elif re.match(r"^(END IF|END WHILE|END REPEAT|UNTIL .*)$", c):
                if depth == 0: return j
                depth -= 1
            elif c == "ELSE" and depth == 0 and opener == "IF": return j
        raise SyntaxError(f"No end for line {i+1}: {code[i]}")
    def block(a, b):
        i = a
        while i < b:
            steps[0] += 1
            if steps[0] > max_steps: raise Loop("Program did not finish (infinite loop?)")
            c = code[i]; m = None
            if (m := re.match(r"^SET (\w+) TO (.+)$", c)): env[m[1]] = ev(m[2]); i += 1
            elif (m := re.match(r"^RECEIVE (\w+) FROM .+$", c)):
                if not inp: raise ValueError(f"No input left for line {i+1}")
                env[m[1]] = inp.pop(0); i += 1
            elif (m := re.match(r"^SEND (.+) TO (\w+)$", c)): out.append(_fmt(ev(m[1]))); i += 1
            elif (m := re.match(r"^IF (.+) THEN$", c)):
                j = find_end(i, "IF", None)
                if code[j] == "ELSE":
                    k = find_end(j, "ELSE", None)
                    block(i + 1, j) if ev(m[1]) else block(j + 1, k); i = k + 1
                else:
                    if ev(m[1]): block(i + 1, j)
                    i = j + 1
            elif (m := re.match(r"^WHILE (.+) DO$", c)):
                j = find_end(i, "WHILE", None)
                while ev(m[1]):
                    steps[0] += 1
                    if steps[0] > max_steps: raise Loop("Program did not finish (infinite loop?)")
                    block(i + 1, j)
                i = j + 1
            elif (m := re.match(r"^REPEAT (.+) TIMES$", c)):
                j = find_end(i, "REPEAT", None)
                for _ in range(int(ev(m[1]))): block(i + 1, j)
                i = j + 1
            elif c == "REPEAT":
                j = find_end(i, "REPEAT", None); cond = re.match(r"^UNTIL (.+)$", code[j])[1]
                while True:
                    block(i + 1, j)
                    if ev(cond): break
                    steps[0] += 1
                    if steps[0] > max_steps: raise Loop("Program did not finish (infinite loop?)")
                i = j + 1
            else: raise SyntaxError(f"Unknown line {i+1}: {c}")
    block(0, len(code))
    return out, env
