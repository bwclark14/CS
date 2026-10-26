#!/bin/sh
cd "$(dirname "$0")"
{ cat 01-head.html 02-top-p1.html 03-p2-p3.html 04-p4-end.html; echo '<script>'; cat 05-script-a.js 06-script-b.js 07-script-c.js; echo '</script>'; echo '</body>'; echo '</html>'; } > ../index.html
wc -c ../index.html
