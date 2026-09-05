import katex from 'katex';

/**
 * Utility to convert natural mathematical notations into LaTeX
 * and render them via KaTeX into accessible, beautifully typeset HTML.
 *
 * Supports:
 * - Proper stacked fractions (\frac{a}{b}, 2/3, 3/8, (x+1)/(x-1), 2 1/2)
 * - Surds / square roots (\sqrt{x}, sqrt(x), \sqrt[3]{x}, √x)
 * - Powers and exponents (x^2, x^{n}, 10^-3, unicode x², y³)
 * - Subscripts (x_1, a_n)
 * - Common math operators (+/-, *, !=, <=, >=, \pi, \theta, \pm, \times, \div)
 * - Explicit LaTeX blocks ($...$, $$...$$, \[...\], \(...\))
 */

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', 'ⁿ': 'n', 'ⁱ': 'i',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-',
};

/**
 * Strips unwanted LaTeX dollar delimiters ($ or $$) from question prompts,
 * options, explanations, and model answers so that teachers and students
 * never see raw $ characters in the user interface.
 */
export function removeDollarDelimiters(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    // Replace block math $$...$$ with clean inner content
    .replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, '$1')
    // Replace inline math $...$ with clean inner content
    .replace(/\$\s*([^\$\n]+?)\s*\$/g, '$1')
    // Strip any remaining stray dollar signs
    .replace(/\$+/g, '')
    .trim();
}

/**
 * Check whether a string contains any mathematical notation
 */
export function hasMathNotation(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // Explicit LaTeX delimiters or commands
  if (/\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([^\n]+?\\\)|\\[a-zA-Z]+/.test(text)) {
    return true;
  }

  // Fractions: e.g. 2/3, 5/8, (x+1)/(x-2)
  if (/(^|[^\w\/])(-?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])|\([^)]+\)\s*\/\s*\([^)]+\)/.test(text)) {
    return true;
  }

  // Surds / roots: sqrt(x), √x, cbrt(x)
  if (/√|\bsqrt\(|\bcbrt\(/.test(text)) {
    return true;
  }

  // Powers: x^2, (a+b)^2, 10^-3, unicode superscripts x²
  if (/[a-zA-Z0-9\)]\^(\([^\)]+\)|[a-zA-Z0-9\-]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]/.test(text)) {
    return true;
  }

  // Common math symbols
  if (/(\+\/-|\+-|≠|≤|≥|≈|±|×|÷|π|θ)/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Convert natural text mathematical patterns into LaTeX expressions wrapped in $...$
 */
export function convertNaturalMathToLatex(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Regex to match existing math blocks: $$...$$, \[...\], $...$, \(...\)
  const mathBlockRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([^\n]+?\\\))/g;

  // Split text into existing math blocks vs non-math plain text
  const parts = text.split(mathBlockRegex);

  const processedParts = parts.map((part) => {
    if (!part) return '';

    // If this part is ALREADY a valid math block, keep it intact without modifying it!
    if (
      (part.startsWith('$$') && part.endsWith('$$')) ||
      (part.startsWith('\\[') && part.endsWith('\\]')) ||
      (part.startsWith('$') && part.endsWith('$')) ||
      (part.startsWith('\\(') && part.endsWith('\\)'))
    ) {
      return part;
    }

    // Otherwise, process natural math in this plain text segment
    let s = part;

    // Preserve non-math slashes: URLs, dates, and common English idioms
    const preserved: string[] = [];
    s = s.replace(/https?:\/\/[^\s]+/g, (m) => {
      preserved.push(m);
      return `__PRESERVED_${preserved.length - 1}__`;
    });

    // Protect dates like 2026/09/04 or 04/09/2026
    s = s.replace(/\b\d{4}\/\d{1,2}\/\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, (m) => {
      preserved.push(m);
      return `__PRESERVED_${preserved.length - 1}__`;
    });

    // Protect common idioms and units with slashes
    s = s.replace(/\b(and\/or|true\/false|yes\/no|pass\/fail|either\/or|n\/a|km\/h|m\/s|w\/o)\b/gi, (m) => {
      preserved.push(m);
      return `__PRESERVED_${preserved.length - 1}__`;
    });

    // 1. Convert unwrapped raw LaTeX commands like \frac{a}{b}, \sqrt{x}, \pm, \times, \div, \pi, \theta
    s = s.replace(/(\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt(\[[^\]]*\])?\{[^{}]*\}|\\pm|\\times|\\div|\\pi|\\theta|\\le|\\ge|\\neq)/g, (m) => {
      return `$${m}$`;
    });

    // 2. Convert unicode roots: √x or √(x + 1) or √16
    s = s.replace(/√\s*(\([^\)]+\)|[a-zA-Z0-9]+)/g, (_m, g1) => {
      const inner = g1.startsWith('(') && g1.endsWith(')') ? g1.slice(1, -1) : g1;
      return `$\\sqrt{${inner}}$`;
    });

    // 3. Convert sqrt(expr), cbrt(expr), and sqrt[n](expr)
    s = s.replace(/\bsqrt\[([^\]]+)\]\(([^)]+)\)/g, '$\\sqrt[$1]{$2}$');
    s = s.replace(/\bcbrt\(([^)]+)\)/g, '$\\sqrt[3]{$1}$');
    s = s.replace(/\bsqrt\(([^)]+)\)/g, '$\\sqrt{$1}$');

    // 4. Convert powers: (x+1)^2, x^2, 10^-3, 2^n
    s = s.replace(/([a-zA-Z0-9\)]+)\^(\([^\)]+\)|[a-zA-Z0-9\-]+)/g, (_m, base, exp) => {
      const cleanExp = exp.startsWith('(') && exp.endsWith(')') ? exp.slice(1, -1) : exp;
      return `$${base}^{${cleanExp}}$`;
    });

    // 5. Convert unicode superscripts: x², y³, 10⁵
    s = s.replace(/([a-zA-Z0-9\)])([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿⁱ]+)/g, (_m, base, sup) => {
      const exp = Array.from(sup as string).map((c: string) => SUPERSCRIPT_MAP[c] || c).join('');
      return `$${base}^{${exp}}$`;
    });

    // 6. Convert unicode subscripts: x₁, aₙ
    s = s.replace(/([a-zA-Z0-9])([₀₁₂₃₄₅₆₇₈₉₋₊]+)/g, (_m, base, sub) => {
      const exp = Array.from(sub as string).map((c: string) => SUBSCRIPT_MAP[c] || c).join('');
      return `$${base}_{${exp}}$`;
    });

    // 7. Convert parenthesized fractions: (x+1)/(x-1) or (3x^2)/4
    s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '$\\frac{$1}{$2}$');
    s = s.replace(/\(([^)]+)\)\s*\/\s*([a-zA-Z0-9]+)/g, '$\\frac{$1}{$2}$');
    s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\(([^)]+)\)/g, '$\\frac{$1}{$2}$');

    // 8. Convert mixed numbers: e.g. 2 1/2 or 3 3/4
    s = s.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, '$1$\\frac{$2}{$3}$');

    // 9. Standalone numeric fractions: 3/8, 5/16, -1/2, 2/3
    s = s.replace(/(^|[^\w\/])(-?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, (_m, prefix, num, den) => {
      return `${prefix}$\\frac{${num}}{${den}}$`;
    });

    // 10. Convert +/- to \pm
    s = s.replace(/(\+\/-|\+-)/g, '$\\pm$');

    // Restore preserved text
    preserved.forEach((orig, idx) => {
      s = s.replace(`__PRESERVED_${idx}__`, orig);
    });

    return s;
  });

  // Recombine all processed parts
  let result = processedParts.join('');

  // Clean up any double dollar signs or empty math delimiters
  result = result.replace(/\$\$+/g, '$').replace(/\$\s*\$/g, '');

  return result;
}

/**
 * Render LaTeX math string via KaTeX into HTML
 */
export function renderLatex(math: string, displayMode: boolean = false): string {
  try {
    let cleanMath = math.replace(/\$+/g, '').trim();
    // For fractions, upgrade \frac to \dfrac for crisp, clearly legible display sizing
    if (cleanMath.includes('\\frac{') && !cleanMath.includes('\\dfrac{')) {
      cleanMath = cleanMath.replace(/\\frac\{/g, '\\dfrac{');
    }
    return katex.renderToString(cleanMath, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    console.warn('KaTeX render warning:', err);
    return `<span class="font-mono text-slate-800">${escapeHtml(math.replace(/\$+/g, ''))}</span>`;
  }
}

/**
 * Escape HTML special characters for fallback rendering
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse any arbitrary text containing math (natural or LaTeX) and render it to HTML.
 * Normal English text is preserved, and math expressions are typeset using KaTeX.
 */
export function renderMathToHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Check if text already has explicit block math $$...$$ or \[...\]
  const hasBlocks = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]/.test(text);
  if (hasBlocks) {
    const blockRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g;
    return text
      .split(blockRegex)
      .map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const inner = part.slice(2, -2).trim();
          return `<div class="my-2 flex justify-center overflow-x-auto py-1">${renderLatex(inner, true)}</div>`;
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const inner = part.slice(2, -2).trim();
          return `<div class="my-2 flex justify-center overflow-x-auto py-1">${renderLatex(inner, true)}</div>`;
        }
        return renderInlineMath(part);
      })
      .join('');
  }

  return renderInlineMath(text);
}

/**
 * Helper to process inline math and natural math expressions
 */
function renderInlineMath(text: string): string {
  if (!text) return '';

  // Pre-process natural math to $...$
  const preprocessed = convertNaturalMathToLatex(text);

  // Match inline math: $...$ or \(...\).
  // Using [^\$\n] to prevent runaway matching across paragraphs while remaining inline.
  const inlineRegex = /(\$[^\$\n]+?\$|\\\([^\n]+?\\\))/g;

  const chunks = preprocessed.split(inlineRegex);
  if (chunks.length === 1) {
    // If no split occurred, clean any stray dollar signs and return escaped text
    const cleanText = text.replace(/\$+/g, '');
    return escapeHtml(cleanText).replace(/\n/g, '<br/>');
  }

  return chunks
    .map((chunk) => {
      if (!chunk) return '';

      if (chunk.startsWith('$') && chunk.endsWith('$')) {
        const math = chunk.replace(/^\$+|\$+$/g, '').trim();
        if (!math) return '';
        return renderLatex(math, false);
      }
      if (chunk.startsWith('\\(') && chunk.endsWith('\\)')) {
        const math = chunk.slice(2, -2).trim();
        if (!math) return '';
        return renderLatex(math, false);
      }

      // If chunk is just an isolated orphan '$' or has stray '$', strip them
      const cleanChunk = chunk.replace(/\$+/g, '');
      if (!cleanChunk) {
        return '';
      }

      return escapeHtml(cleanChunk).replace(/\n/g, '<br/>');
    })
    .join('');
}
