#!/bin/bash
# Builds the single-file offline app from the source parts.
# Output: public/plant-growth-lab/index.html (served by Vite/Vercel at /plant-growth-lab/)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
P="$DIR/parts"
OUT="$DIR/../../public/plant-growth-lab/index.html"
mkdir -p "$(dirname "$OUT")"
{ cat "$P/head.html"; cat "$P/three.html"; echo '<script>'; cat "$P/a_data.js" "$P/a_data2.js" "$P/b_engine.js" "$P/c_soil.js" "$P/c_plants.js" "$P/d_bean.js" "$P/e_tomato.js" "$P/f_ui.js" "$P/g_micro.js" "$P/h_whatif.js" "$P/i_more.js" "$P/z_end.js"; echo '</script>'; cat "$P/tail.html"; } > "$OUT"
echo "Built $OUT"
