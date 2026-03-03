import { getStreakData } from './streak';

/**
 * Z-26 Share Card Utility (Harden v1.2)
 * 1200x630 の標準SNSサイズで、非医療を前提とした結果画像を生成する。
 */

const COLORS = {
    brandNavy: '#1F3A5F',
    brandJade: '#6FC3B2',
    white: '#FFFFFF',
    textWhite: '#F8FAFC',
    muted: '#94A3B8'
};

export interface ShareCardData {
    typeName: string;
    typeDescription: string;
    typeCare: string;
    score: number;
    plan: string;
    shareQuestion?: string;
}

export const getShareMessage = (score: number): string => {
    if (score >= 80) return "良いバランスを保てているようです。";
    if (score >= 60) return "少し休息が必要なサインが出ています。";
    if (score >= 40) return "日々の習慣を見直す良い機会かもしれません。";
    return "心身の声を聴き、無理をせず過ごしましょう。";
};

export const generateShareCard = async (data: ShareCardData): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const width = 1200;
            const height = 630;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Could not get 2d context");

            const fontFamily = '"Noto Sans JP", sans-serif';

            // 1. Background Gradient (Brand Navy)
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);
            bgGradient.addColorStop(0, '#1F3A5F');
            bgGradient.addColorStop(1, '#0F1C2E');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Decorative elements (mesh-like circles)
            ctx.globalAlpha = 0.4;
            const drawCircle = (x: number, y: number, r: number, color: string) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, color);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            };
            drawCircle(width * 0.8, height * 0.2, 400, 'rgba(111, 195, 178, 0.2)');
            drawCircle(width * 0.2, height * 0.8, 300, 'rgba(31, 58, 95, 0.5)');
            ctx.globalAlpha = 1.0;

            // 3. Header: Today's Condition
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.brandJade;
            ctx.font = `black 28px ${fontFamily}`;
            ctx.letterSpacing = "0.2em";
            ctx.fillText("今日のコンディション", width / 2, 100);

            // 4. Main Type Name (Emphasized)
            ctx.fillStyle = COLORS.white;
            ctx.font = `900 96px ${fontFamily}`;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.fillText(data.typeName, width / 2, 220);
            ctx.shadowBlur = 0;

            // 5. Short Description
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `500 36px ${fontFamily}`;
            ctx.fillText(data.typeDescription.slice(0, 15), width / 2, 290);

            // 6. Score Box (Premium Design)
            const boxW = 400;
            const boxH = 180;
            const boxX = (width - boxW) / 2;
            const boxY = 340;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 24);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = COLORS.brandJade;
            ctx.font = `black 20px ${fontFamily}`;
            ctx.fillText('CONSTITUTIONAL SCORE', width / 2, boxY + 50);

            ctx.fillStyle = COLORS.white;
            ctx.font = `900 90px ${fontFamily}`;
            ctx.fillText(data.score.toString(), width / 2, boxY + 140);

            // 7. Message
            ctx.fillStyle = COLORS.white;
            ctx.font = `700 30px ${fontFamily}`;
            ctx.fillText(getShareMessage(data.score), width / 2, 560);

            // 8. Share Question (v1.5 Hook)
            if (data.shareQuestion) {
                ctx.fillStyle = COLORS.brandJade;
                ctx.font = `black 28px ${fontFamily}`;
                ctx.fillText(`Q. ${data.shareQuestion}`, width / 2, 595);
            }

            // 9. Bottom Disclaimer & URL
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = `500 14px ${fontFamily}`;
            ctx.fillText("※本解析はAIによる推論であり医療診断ではありません。体調に不安がある場合は医師にご相談ください。", width / 2, 615);

            // PNG Output
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);

        } catch (e) {
            console.error("Failed to generate Share Card (Harden v1.2)", e);
            reject(e);
        }
    });
};
