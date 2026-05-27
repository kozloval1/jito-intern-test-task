function convertHtml2JsonAndSet() {
  const htmlTextAreaValue = document.getElementById("html").value;
  const jsonObj = html2json(htmlTextAreaValue);
  const jsonArea = document.getElementById("json");
  jsonArea.textContent = JSON.stringify(jsonObj, null, 2);
}

/*
  Converts an HTML string into a JSON tree without using any DOM parser.

  JSON node schema:
    { type: "root",    children: [...] }
    { type: "doctype", value: "html" }
    { type: "comment", value: "..." }
    { type: "text",    value: "..." }
    { type: "element", tag: "div", attributes: {...}, selfClosing: false, children: [...] }

  Single regex tokenises the whole string in one pass; a stack builds the tree.
  Regex capture groups: 1=comment  2=doctype  3=close-tag
                        4=tag-name 5=attrs    6=self-slash  7=text
*/
function html2json(htmlText) {
  if (typeof htmlText !== "string" || htmlText.trim() === "") return null;

  const VOID = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);

  const TOKEN = /<!--([\s\S]*?)-->|<!DOCTYPE([^>]*)>|<\/([a-z][a-z0-9:-]*)\s*>|<([a-z][a-z0-9:-]*)((?:\s(?:[^"'>/]|"[^"]*"|'[^']*')*)*)(\/?)\s*>|([^<]+)/gi;

  const root = { type: "root", children: [] };
  const stack = [root];
  let m;

  while ((m = TOKEN.exec(htmlText)) !== null) {
    const parent = stack[stack.length - 1];

    if (m[1] !== undefined) {
      parent.children.push({ type: "comment", value: m[1].trim() });

    } else if (m[2] !== undefined) {
      parent.children.push({ type: "doctype", value: m[2].trim() });

    } else if (m[3]) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === m[3].toLowerCase()) { stack.length = i; break; }
      }

    } else if (m[4]) {
      const tag = m[4].toLowerCase();
      const attrs = parseAttributes(m[5] || "");
      const selfClosing = !!m[6] || VOID.has(tag);
      const node = { type: "element", tag, selfClosing };
      if (Object.keys(attrs).length) node.attributes = attrs;
      if (!selfClosing) node.children = [];
      parent.children.push(node);
      if (!selfClosing) stack.push(node);

    } else if (m[7]) {
      const text = m[7].replace(/\s+/g, " ").trim();
      if (text) parent.children.push({ type: "text", value: decodeEntities(text) });
    }
  }

  return root.children.length === 1 ? root.children[0] : root;
}

function parseAttributes(attrStr) {
  const attrs = {};
  const re = /([^\s"'>/=]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1].toLowerCase();
    attrs[name] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : true;
  }
  return attrs;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&nbsp;/gi, " ")
    .replace(/&copy;/gi, "©").replace(/&reg;/gi, "®").replace(/&trade;/gi, "™")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function showExample1() {
  const htmlExample = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport">
    <title>Sample HTML</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
    </header>
    <nav>
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is the home section of the webpage.</p>
        </section>
        <section id="about">
            <h2>About Section</h2>
            <p>This is the about section of the webpage.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 My Website</p>
    </footer>
    <script src="script.js"></script>
</body>
</html>
`;
  const jsonContent = {
    "Comment 1":
      "You have to think about how to take into account various html inputs so your json structure will cover them all and handle different cases.",
    "Comment 2":
      "When you make any choice in terms of selecting specific json structure for conversion - be ready to provide reasoning behind such choice.",
  };

  document.getElementById("html").value = htmlExample;
  document.getElementById("json").textContent = JSON.stringify(
    html2json(htmlExample),
    null,
    2
  );
}

function showExample2() {
  const htmlExample = `<div>
<p>Hello world!</p>
  <button>Click me!</button>
  <textarea>Some very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long string.</textarea>
</div>
`;
  const jsonContent = {
    "Comment 1":
      "You have to think about how to take into account various html inputs so your json structure will cover them all and handle different cases.",
    "Comment 2":
      "When you make any choice in terms of selecting specific json structure for conversion - be ready to provide reasoning behind such choice.",
  };

  document.getElementById("html").value = htmlExample;
  document.getElementById("json").textContent = JSON.stringify(
    html2json(htmlExample),
    null,
    2
  );
}
