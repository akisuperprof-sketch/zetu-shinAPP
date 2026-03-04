import { ExplainTreeNode } from './explainTree.js';

interface MetaData {
    build: string;
    role: string;
    generatedAt: string;
}

/**
 * Z-26 Explain Tree HTML Generator (Hardened v1.2)
 * 100点品質の単体HTMLレポートを出力。
 */
export function explainTreeToHtml(node: ExplainTreeNode, meta: MetaData): string {
    const renderNode = (n: ExplainTreeNode, depth = 0): string => {
        const isRoot = n.kind === 'root';
        const isResult = n.kind === 'result' || n.id.includes('top1');
        const isSection = n.kind === 'section';
        const childrenHtml = n.children ? n.children.map(c => renderNode(c, depth + 1)).join("") : "";
        const chipHtml = n.chips ? n.chips.map(c => `<span class="badge ${c.includes('9タイプ') ? 'badge-type' : ''}">${c}</span>`).join("") : "";

        return `
            <details ${depth < 2 ? 'open' : ''} class="tree-node kind-${n.kind} ${isRoot ? 'root-node' : ''}">
                <summary class="${isResult ? 'result-summary' : ''} ${isSection ? 'section-summary' : ''}">
                    <span class="kind-tag">${n.kind.toUpperCase()}</span>
                    <strong>${n.title}</strong>
                    ${chipHtml}
                </summary>
                <div class="node-content">
                    ${n.summary ? `<p class="node-summary">${n.summary}</p>` : ""}
                    ${childrenHtml}
                </div>
            </details>
        `;
    };

    const conditionNode = node.children?.find(c => c.id === 'condition-type');
    const ssotSection = node.children?.find(c => c.id === 'ssot-section');
    const top1Node = ssotSection?.children?.find(c => c.id === 'top1-highlight');
    const top3Node = ssotSection?.children?.find(c => c.id === 'top3-list');

    // DEV限定: 検証用置換ログ。本番は絶対に出さない。
    const renderSanitizeLog = () => {
        if (!import.meta.env.DEV || !node.sanitizeLog || node.sanitizeLog.length === 0) return "";
        return `
            <div class="dev-log">
                <h4>DEV SANITIZE LOG (置換履歴)</h4>
                <ul>
                    ${node.sanitizeLog.map(l => `<li>${l}</li>`).join("")}
                </ul>
            </div>
        `;
    };

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explain Tree | Z-26 Internal Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --navy: #1F3A5F;
            --jade: #6FC3B2;
            --pro-dark: #0F1C2E;
            --bg-body: #f1f5f9;
            --bg-card: #ffffff;
            --text-main: #1e293b;
            --text-sub: #64748b;
            --border-color: #e2e8f0;
            --caution-bg: #fef2f2;
            --caution-text: #b91c1c;
        }

        * { box-sizing: border-box; }
        body {
            font-family: 'Noto Sans JP', sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container {
            width: 100%;
            max-width: 900px;
            padding: 2.5rem 1.5rem;
        }

        header {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            border-left: 8px solid var(--navy);
            position: relative;
        }

        header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--navy);
        }

        .meta-bar {
            margin-top: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1.25rem;
            font-size: 0.75rem;
            color: var(--text-sub);
            border-top: 1px solid var(--border-color);
            padding-top: 1rem;
        }

        .caution-banner {
            background-color: var(--caution-bg);
            border: 1px solid #fee2e2;
            color: var(--caution-text);
            padding: 1rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: bold;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }

        /* Today's Condition Card */
        .card-large {
            background-color: #ecfeff;
            border: 2px solid #a5f3fc;
            border-radius: 12px;
            padding: 2.5rem;
            margin-bottom: 2.5rem;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
            text-align: center;
        }

        .card-large .label { font-size: 0.7rem; font-weight: 900; color: #0891b2; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 0.75rem; display: block; }
        .card-large .title { font-size: 2.25rem; font-weight: 900; color: #164e63; margin: 0; letter-spacing: -0.025em; }
        .card-large .desc { font-size: 1.1rem; color: #155e75; margin-top: 1.25rem; font-weight: 500; }

        /* Emphasized Patterns (Top 1/3) */
        .highlight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
        .card-sub { background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .card-sub .label { font-size: 0.65rem; font-weight: 900; color: var(--text-sub); margin-bottom: 0.5rem; display: block; }
        .card-sub .title { font-size: 1.25rem; font-weight: 900; color: var(--navy); margin: 0; }
        .card-sub.special { border-left: 5px solid var(--jade); background: #f0fdfa; border-color: #ccfbf1; }
        .card-sub.special .title { color: #0d9488; }

        /* Tree Styles */
        .tree-node { margin-top: 0.75rem; }
        .tree-node > summary { cursor: pointer; display: flex; align-items: center; padding: 0.8rem 1rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); list-style: none; transition: background 0.2s; }
        .tree-node > summary:hover { background: #f8fafc; }
        .tree-node > summary::-webkit-details-marker { display: none; }
        
        summary::before { content: "▶"; font-size: 0.55rem; color: var(--text-sub); width: 1.5rem; transition: transform 0.2s; }
        details[open] > summary::before { transform: rotate(90deg); }

        .node-content { padding: 1rem 0 1rem 2rem; border-left: 2px dashed var(--border-color); margin-left: 1.5rem; }
        .node-summary { font-size: 0.85rem; color: #475569; margin: 0 0 1rem 0; font-weight: 500; }

        .kind-tag { font-size: 0.6rem; background: #64748b; color: #fff; padding: 0.1rem 0.4rem; border-radius: 4px; margin-right: 0.75rem; font-weight: 900; letter-spacing: 0.05em; }
        .badge { font-size: 0.65rem; background: #e2e8f0; color: #475569; padding: 0.1rem 0.5rem; border-radius: 9999px; margin-left: 0.5rem; border: 1px solid rgba(0,0,0,0.05); }
        .badge-type { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }

        .section-summary { font-size: 1rem; color: var(--navy); font-weight: 700; background: #f8fafc !important; }

        footer { text-align: center; color: var(--text-sub); font-size: 0.7rem; margin-top: 5rem; border-top: 1px solid var(--border-color); padding-top: 2rem; }

        .btns { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; gap: 0.5rem; }
        .btn { border: 1px solid var(--border-color); background: #fff; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.7rem; font-weight: 900; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .btn:hover { background: #f8fafc; color: var(--navy); border-color: var(--navy); shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .dev-log { margin-top: 3rem; background: #1e293b; color: #94a3b8; padding: 1.5rem; border-radius: 12px; font-family: monospace; font-size: 0.7rem; text-align: left; }
        .dev-log h4 { color: #facc15; margin: 0 0 0.5rem 0; font-size: 0.8rem; }
        .dev-log ul { margin: 0; padding-left: 1.5rem; }

        #toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 700; opacity: 0; transition: opacity 0.3s, transform 0.3s; z-index: 1000; pointer-events: none; }
        #toast.show { opacity: 1; transform: translate(-50%, -10px); }

        @media (max-width: 640px) {
            .highlight-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container animate-in">
        <header>
            <div class="btns">
                <button class="btn" onclick="copyHTML()">Copy HTML</button>
                <button class="btn" onclick="copyText()">Copy Text</button>
            </div>
            <h1>Explain Tree Report (v1.2 Hardened)</h1>
            <div class="meta-bar">
                <span><b>Build:</b> ${meta.build}</span>
                <span><b>Role:</b> ${meta.role}</span>
                <span><b>Date:</b> ${meta.generatedAt}</span>
                <span><b>Safety:</b> Hardened v1.2</span>
            </div>
            <div class="caution-banner">
                <div>⚠️</div>
                <div>本資料は開発・確認用の内部ドキュメントです。医療的な「判定」を行うものではなく、推論ロジックの透明性と論理的整合性のための可視化です。</div>
            </div>
        </header>

        ${conditionNode ? `
        <section class="card-large">
            <span class="label">Primary Prediction (Condition Type)</span>
            <h2 class="title">${conditionNode.title.replace('コンディション: ', '')}</h2>
            <p class="desc">${conditionNode.summary}</p>
        </section>` : ""}

        <div class="highlight-grid">
            <div class="card-sub special">
                <span class="label">Top 1 Logic Output</span>
                <h3 class="title">${top1Node?.title.replace('最有力パターン: ', '') || 'N/A'}</h3>
            </div>
            <div class="card-sub">
                <span class="label">Associated patterns (Top 3)</span>
                <h3 class="title">${top3Node?.children ? top3Node.children.map(c => c.title).join(', ') : 'N/A'}</h3>
            </div>
        </div>

        <main id="tree-root">
            ${renderNode(node)}
        </main>

        ${renderSanitizeLog()}

        <footer>
            &copy; 2026 Project z-26. Generated for Internal Audit and Quality Control only.
        </footer>
    </div>

    <div id="toast">Copied to clipboard!</div>

    <script>
        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }

        function copyHTML() {
            navigator.clipboard.writeText(document.documentElement.outerHTML).then(() => showToast("HTML Copied!"));
        }

        function copyText() {
            navigator.clipboard.writeText(document.getElementById('tree-root').innerText).then(() => showToast("Summary Text Copied!"));
        }
    </script>
</body>
</html>`;
}
