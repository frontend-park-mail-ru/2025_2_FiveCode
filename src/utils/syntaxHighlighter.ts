function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "JOIN",
  "LEFT",
  "RIGHT",
  "INNER",
  "OUTER",
  "ON",
  "AND",
  "OR",
  "NOT",
  "NULL",
  "ORDER",
  "BY",
  "GROUP",
  "LIMIT",
  "AS",
  "IN",
  "VALUES",
  "CREATE",
  "TABLE",
  "DROP",
  "ALTER",
  "KEY",
  "PRIMARY",
]);

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "import",
  "export",
  "default",
  "class",
  "extends",
  "new",
  "this",
  "try",
  "catch",
  "await",
  "async",
  "typeof",
  "void",
]);

function tokenize(code: string, keywords: Set<string>): string {
  const tokenRegex =
    /((?:\/\/[^\n]*)|(?:\/\*[\s\S]*?\*\/)|(?:--[^\n]*))|(["'`].*?["'`])|(\b\d+\b)|(\b[a-zA-Z_$]\w*\b)|(\s+)|([^a-zA-Z0-9\s"'`]+)/g;

  return code.replace(
    tokenRegex,
    (match, comment, string, number, word, whitespace, operator) => {
      if (whitespace) return whitespace;

      if (comment)
        return `<span class="token-comment">${escapeHtml(comment)}</span>`;
      if (string)
        return `<span class="token-string">${escapeHtml(string)}</span>`;
      if (number) return `<span class="token-number">${number}</span>`;

      if (word) {
        const upper = word.toUpperCase();
        const isSql = keywords === SQL_KEYWORDS;

        if (keywords.has(isSql ? upper : word)) {
          return `<span class="token-keyword">${word}</span>`;
        }
        return word;
      }

      if (operator) return escapeHtml(operator);

      return escapeHtml(match);
    }
  );
}

export function highlightCode(code: string, language: string): string {
  if (!code) return "";

  if (language === "sql") {
    return tokenize(code, SQL_KEYWORDS);
  } else if (language === "javascript") {
    return tokenize(code, JS_KEYWORDS);
  }

  return escapeHtml(code);
}
