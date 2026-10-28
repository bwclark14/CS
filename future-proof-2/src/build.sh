#!/bin/sh
# Rebuilds ../index.html (pupils) and ../teacher.html from the pieces in this folder.
cd "$(dirname "$0")"
{ cat 01-head.html 02-home-m1-m3.html 03-m4-m5.html 04-m6-m8.html 05-m9-m12.html; echo '<script>'; cat 06-script-a.js 07-script-b.js 08-script-c.js 09-script-d.js; echo '</script>'; echo '</body>'; echo '</html>'; } > ../index.html
# teacher page: same head and styles, its own title and body
sed -e 's|<title>Future Proof 2</title>|<title>Future Proof 2 · Teacher notes</title>|' -e 's|<meta name="description"[^>]*>|<meta name="robots" content="noindex">|' 01-head.html > ../teacher.html
cat 10-teacher-body.html >> ../teacher.html
wc -c ../index.html ../teacher.html
