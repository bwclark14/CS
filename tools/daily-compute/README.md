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
