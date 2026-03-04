import { ExplainTreeNode } from './explainTree.js';

/**
 * 説明ツリーを Markdown 形式に変換する。
 * 同時に Mermaid 形式のフローチャートも生成する。
 */
export function explainTreeToMarkdown(node: ExplainTreeNode, maxDepth = 4): string {
    const mermaidLines: string[] = ["flowchart TD"];
    const mdLines: string[] = [];

    // ツリーを Markdown リストに変換（深さ制限付き）
    function traverseMD(n: ExplainTreeNode, depth: number) {
        if (depth > maxDepth) return;

        const indent = "  ".repeat(depth);
        const prefix = depth === 0 ? "# " : (depth === 1 ? "## " : (depth === 2 ? "### " : "- "));

        mdLines.push(`${indent}${prefix}${n.title}`);
        if (n.summary) {
            mdLines.push(`${indent}  ${n.summary}`);
        }
        if (n.chips && n.chips.length > 0) {
            mdLines.push(`${indent}  > [${n.chips.join(", ")}]`);
        }

        if (n.children && n.children.length > 0) {
            n.children.forEach(child => traverseMD(child, depth + 1));
        }
    }

    // ツリーを Mermaid に変換（深さ制限付き、安全なラベル処理）
    function traverseMermaid(n: ExplainTreeNode, depth: number) {
        if (depth >= maxDepth) return;
        if (!n.children) return;

        n.children.forEach(child => {
            const parentLabel = `"${n.title.replace(/"/g, "'")}"`;
            const childLabel = `"${child.title.replace(/"/g, "'")}"`;
            mermaidLines.push(`    ${n.id}[${parentLabel}] --> ${child.id}[${childLabel}]`);
            traverseMermaid(child, depth + 1);
        });
    }

    // 生成実行
    traverseMD(node, 0);
    traverseMermaid(node, 0);

    return `
# 説明ツリー (Explain Tree v1)
> 内部確認用：本資料は医療的な「診断」ではなく、AIの内部推論プロセスを視覚化したものです。

## 構造図 (Mermaid)
\`\`\`mermaid
${mermaidLines.join("\n")}
\`\`\`

## ツィアーキー (階層リスト)
${mdLines.join("\n")}
    `.trim();
}
