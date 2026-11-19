# Daily Compute checker

Used by the Daily Compute drafting and publishing tasks before a story is saved or published.

```
python3 tools/daily-compute/validate_story.py draft.json            # one story (or a draft with a "story" field)
python3 tools/daily-compute/validate_story.py daily-compute/stories.json --all
```

It checks the story's structure, the quiz, Four Links and every extra challenge. Code activities
(code puzzle, bug hunt, predict the output, complete the code) are checked by running the pseudocode
with `pseudo.py`, so a wrong answer key or a "wrong" option that actually works is caught.

Extra challenge types: `parsons`, `bug`, `predict`, `complete` (code), and `binary`, `sort`, `order`, `factop`.
Each story has 3 or 4 extras, at most one of each type, and at least 2 code activities where the story allows.

## Group quiz checker

```
python3 tools/daily-compute/validate_group_quiz.py daily-compute/group-quiz/<story-id>.json
python3 tools/daily-compute/validate_group_quiz.py --all
```

Checks a group quiz question file: the format, 10-16 questions, options and answer indices, and no
repeats of the story's own quiz or activities. Every code question is run with `pseudo.py` to check the
answer key (counts, traced output, TRUE/FALSE conditions). See `cloudflare/group-quiz/README.md`.
