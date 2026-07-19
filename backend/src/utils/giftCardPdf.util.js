/**
 * Premium printable gift-card PDF generator (A4 sheets, 300 DPI QR assets).
 * Arabic labels are rendered via Sharp+SVG for correct RTL shaping.
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const sharp = require("sharp");

const MM_TO_PT = 72 / 25.4;
const CARD_MM = 60;
const CARD_PT = CARD_MM * MM_TO_PT;
const GAP_MM = 5;
const GAP_PT = GAP_MM * MM_TO_PT;
const COLS = 3;
const ROWS = 4;
const CARDS_PER_PAGE = COLS * ROWS;

const GRID_W = COLS * CARD_PT + (COLS - 1) * GAP_PT;
const GRID_H = ROWS * CARD_PT + (ROWS - 1) * GAP_PT;
const A4_W = 595.28;
const A4_H = 841.89;
const GRID_X = (A4_W - GRID_W) / 2;
const GRID_Y = (A4_H - GRID_H) / 2;

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E8D48B";
const RED_SOFT = "#E57373";
const RED_BRAND = "#DC2626";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#64748B";

const FONT_DIR = path.join(__dirname, "../../node_modules/@fontsource/cairo/files");
const FONT_CANDIDATES = {
  regular: [
    path.join(__dirname, "../../assets/fonts/Cairo-Regular.ttf"),
    path.join(FONT_DIR, "cairo-arabic-400-normal.woff"),
    path.join(FONT_DIR, "cairo-arabic-400-normal.woff2"),
  ],
  bold: [
    path.join(__dirname, "../../assets/fonts/Cairo-Bold.ttf"),
    path.join(FONT_DIR, "cairo-arabic-700-normal.woff"),
    path.join(FONT_DIR, "cairo-arabic-700-normal.woff2"),
  ],
};

const LOGO_CANDIDATES = [
  path.join(__dirname, "../../assets/brand/win-gold-customer-logo.png"),
  path.join(__dirname, "../../../customerFrontend/src/assets/logo/win-goldenstore-logo.png"),
  path.join(__dirname, "../../../win_golden_flutter/assets/brand/win-goldenstore-logo.png"),
];

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  type: "png",
  margin: 2,
  color: { dark: "#000000", light: "#FFFFFF" },
};

const FRONT_LAYOUT = {
  pad: 7,
  logoSize: 32,
  logoTop: 5,
  giftLabelGap: 3,
  storeGap: 2,
  qrSize: 60,
  qrGap: 3,
  codeGap: 2,
  marketingGap: 2,
  hintGap: 1,
};

const arabicTextCache = new Map();
let logoCache;
let resolvedFonts = null;

function isValidFontBuffer(buf) {
  if (!buf || buf.length < 1024) return false;
  const head = buf.slice(0, 4).toString("ascii");
  if (head === "wOFF" || head === "wOF2") return true;
  if (buf.toString("utf8", 0, 15).includes("<!DOCTYPE")) return false;
  return buf[0] !== 0x3c;
}

function resolveFontPath(variant) {
  for (const candidate of FONT_CANDIDATES[variant]) {
    if (!fs.existsSync(candidate)) continue;
    const buf = fs.readFileSync(candidate);
    if (isValidFontBuffer(buf)) return candidate;
  }
  throw new Error(`Gift card font missing (${variant}). Run npm install in backend.`);
}

function ensureFonts(doc) {
  if (resolvedFonts) return resolvedFonts;

  const regularPath = resolveFontPath("regular");
  const boldPath = resolveFontPath("bold");

  doc.registerFont("Cairo", regularPath);
  doc.registerFont("CairoBold", boldPath);

  resolvedFonts = {
    regularPath,
    boldPath,
    regularData: fs.readFileSync(regularPath),
    boldData: fs.readFileSync(boldPath),
  };
  return resolvedFonts;
}

function fontFormatFromPath(fontPath) {
  if (fontPath.endsWith(".woff2")) return "woff2";
  if (fontPath.endsWith(".woff")) return "woff";
  return "truetype";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderArabicText({
  text,
  widthPt,
  fontSizePt,
  color = TEXT_DARK,
  bold = false,
  align = "center",
  maxLines = 2,
}) {
  const cacheKey = [text, widthPt, fontSizePt, color, bold, align, maxLines].join("|");
  if (arabicTextCache.has(cacheKey)) return arabicTextCache.get(cacheKey);

  const fonts = resolvedFonts || {
    regularPath: resolveFontPath("regular"),
    boldPath: resolveFontPath("bold"),
    regularData: fs.readFileSync(resolveFontPath("regular")),
    boldData: fs.readFileSync(resolveFontPath("bold")),
  };

  const fontPath = bold ? fonts.boldPath : fonts.regularPath;
  const fontData = bold ? fonts.boldData : fonts.regularData;
  const format = fontFormatFromPath(fontPath);

  const widthPx = Math.max(24, Math.round((widthPt / 72) * 300));
  const fontSizePx = Math.max(8, Math.round((fontSizePt / 72) * 300));
  const lineHeightPx = Math.round(fontSizePx * 1.35);
  const heightPx = lineHeightPx * maxLines + 4;

  const anchor = align === "right" ? "end" : align === "left" ? "start" : "middle";
  const x = align === "right" ? widthPx - 2 : align === "left" ? 2 : widthPx / 2;
  const lines = String(text).split("\n").slice(0, maxLines);
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? fontSizePx + 1 : lineHeightPx;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${widthPx}" height="${heightPx}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style><![CDATA[
      @font-face {
        font-family: 'CairoPDF';
        src: url('data:font/${format};base64,${fontData.toString("base64")}') format('${format}');
      }
      .label {
        font-family: 'CairoPDF', sans-serif;
        font-size: ${fontSizePx}px;
        fill: ${color};
        direction: rtl;
        unicode-bidi: plaintext;
      }
    ]]></style>
  </defs>
  <text y="0" text-anchor="${anchor}" class="label">${tspans}</text>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  arabicTextCache.set(cacheKey, { png, widthPt, heightPt: (heightPx / 300) * 72 });
  return arabicTextCache.get(cacheKey);
}

function drawArabicBlock(doc, block, x, y, widthPt) {
  if (!block?.png) return y;
  const drawW = widthPt;
  const drawH = block.heightPt;
  doc.image(block.png, x, y, { width: drawW, height: drawH });
  return y + drawH;
}

async function loadLogoBuffer() {
  if (logoCache !== undefined) return logoCache;

  for (const candidate of LOGO_CANDIDATES) {
    if (!fs.existsSync(candidate)) continue;
    try {
      logoCache = await sharp(candidate)
        .resize(280, 280, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      return logoCache;
    } catch {
      /* try next candidate */
    }
  }

  logoCache = null;
  return null;
}

async function generateQrBuffer(text, px) {
  return QRCode.toBuffer(String(text), {
    ...QR_OPTIONS,
    width: px,
  });
}

function buildGiftActivationUrl(websiteUrl, code) {
  const base = String(websiteUrl || "").replace(/\/$/, "");
  return `${base}/?gift=${encodeURIComponent(code)}`;
}

function cardPosition(slotIndex) {
  const col = slotIndex % COLS;
  const row = Math.floor(slotIndex / COLS);
  return {
    x: GRID_X + col * (CARD_PT + GAP_PT),
    y: GRID_Y + row * (CARD_PT + GAP_PT),
  };
}

function drawRoundedCardFrame(doc, x, y) {
  const radius = 10;

  doc.save();
  doc.roundedRect(x, y, CARD_PT, CARD_PT, radius).clip();
  doc.rect(x, y, CARD_PT, CARD_PT).fill("#FFFFFF");
  doc.rect(x, y, CARD_PT, 3.5).fill(GOLD);
  doc.rect(x, y + CARD_PT - 2, CARD_PT, 2).fill(RED_SOFT);

  doc.opacity(0.07);
  doc.fillColor(GOLD);
  doc.font("CairoBold").fontSize(72);
  doc.text("WG", x, y + CARD_PT * 0.28, {
    width: CARD_PT,
    align: "center",
    lineBreak: false,
  });
  doc.opacity(1);
  doc.restore();

  doc.save();
  doc.roundedRect(x, y, CARD_PT, CARD_PT, radius).lineWidth(0.8).strokeColor(GOLD_LIGHT).stroke();
  doc.restore();
}

async function drawCardFront(doc, x, y, { storeName, code, giftQr, logo }) {
  drawRoundedCardFrame(doc, x, y);

  const L = FRONT_LAYOUT;
  const innerX = x + L.pad;
  const innerW = CARD_PT - L.pad * 2;
  let cursorY = y + L.logoTop;

  if (logo) {
    doc.image(logo, x + (CARD_PT - L.logoSize) / 2, cursorY, {
      width: L.logoSize,
      height: L.logoSize,
      fit: [L.logoSize, L.logoSize],
    });
    cursorY += L.logoSize + L.giftLabelGap;
  } else {
    doc.font("CairoBold").fontSize(9).fillColor(GOLD);
    doc.text("Win Gold", innerX, cursorY, { width: innerW, align: "center", lineBreak: false });
    cursorY += 12 + L.giftLabelGap;
  }

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: "هدية مقدمة من",
      widthPt: innerW,
      fontSizePt: 6.2,
      color: TEXT_MUTED,
    }),
    innerX,
    cursorY,
    innerW
  ) + L.storeGap;

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: storeName || "—",
      widthPt: innerW,
      fontSizePt: 7.4,
      color: TEXT_DARK,
      bold: true,
      maxLines: 1,
    }),
    innerX,
    cursorY,
    innerW
  ) + L.qrGap;

  doc.image(giftQr, x + (CARD_PT - L.qrSize) / 2, cursorY, {
    width: L.qrSize,
    height: L.qrSize,
  });
  cursorY += L.qrSize + L.codeGap;

  doc.font("CairoBold").fontSize(8.2).fillColor(TEXT_DARK);
  doc.text(code, innerX, cursorY, { width: innerW, align: "center", lineBreak: false });
  cursorY += 10 + L.marketingGap;

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: "ابدأ رحلتك مع Win Gold وكن أول فائز",
      widthPt: innerW,
      fontSizePt: 5.4,
      color: GOLD,
      maxLines: 2,
    }),
    innerX,
    cursorY,
    innerW
  ) + L.hintGap;

  drawArabicBlock(
    doc,
    await renderArabicText({
      text: "امسح هذا الرمز من داخل تطبيق Win Gold\nوالطريقة في الخلف",
      widthPt: innerW,
      fontSizePt: 4.8,
      color: TEXT_MUTED,
      maxLines: 2,
    }),
    innerX,
    cursorY,
    innerW
  );
}

function drawBagIcon(doc, cx, cy, s) {
  doc.save();
  doc.moveTo(cx - s, cy - s * 0.2).lineTo(cx - s * 0.7, cy - s).lineTo(cx + s * 0.7, cy - s).lineTo(cx + s, cy - s * 0.2)
    .lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.rect(cx - s, cy - s * 0.2, s * 2, s * 1.2).lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.restore();
}

function drawStarIcon(doc, cx, cy, s) {
  doc.save();
  doc.font("CairoBold").fontSize(s * 3).fillColor(GOLD);
  doc.text("★", cx - s, cy - s, { lineBreak: false });
  doc.restore();
}

function drawStoreIcon(doc, cx, cy, s) {
  doc.save();
  doc.moveTo(cx, cy - s).lineTo(cx + s, cy).lineTo(cx + s, cy + s).lineTo(cx - s, cy + s).lineTo(cx - s, cy)
    .closePath().lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.rect(cx - s * 0.35, cy, s * 0.7, s * 0.55).lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.restore();
}

function drawTrophyIcon(doc, cx, cy, s) {
  doc.save();
  doc.moveTo(cx - s * 0.8, cy - s).lineTo(cx + s * 0.8, cy - s).lineTo(cx + s * 0.5, cy)
    .lineTo(cx + s * 0.2, cy).lineTo(cx + s * 0.2, cy + s * 0.7).lineTo(cx - s * 0.2, cy + s * 0.7)
    .lineTo(cx - s * 0.2, cy).lineTo(cx - s * 0.5, cy).closePath().lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.restore();
}

function drawTicketIcon(doc, cx, cy, size) {
  const w = size;
  const h = size * 0.72;
  const left = cx - w / 2;
  const top = cy - h / 2;
  doc.save();
  doc.roundedRect(left, top, w, h, 2).lineWidth(0.8).strokeColor(RED_BRAND).stroke();
  doc.moveTo(left + w * 0.28, top).lineTo(left + w * 0.28, top + h).strokeColor(RED_SOFT).stroke();
  doc.restore();
}

async function drawFeatureRow(doc, x, y, w, drawIcon, label, desc) {
  drawIcon(doc, x + w - 7, y + 4, 5);
  await drawArabicBlock(
    doc,
    await renderArabicText({
      text: label,
      widthPt: w - 8,
      fontSizePt: 5.2,
      bold: true,
      align: "right",
      maxLines: 1,
    }),
    x,
    y,
    w - 8
  );
  await drawArabicBlock(
    doc,
    await renderArabicText({
      text: desc,
      widthPt: w - 8,
      fontSizePt: 4.4,
      color: TEXT_MUTED,
      align: "right",
      maxLines: 1,
    }),
    x,
    y + 6,
    w - 8
  );
}

async function drawStep(doc, x, y, w, number, text, showTicketIcon = false) {
  const badgeR = 5;
  const badgeX = x + w - badgeR;
  const badgeY = y + badgeR + 1;

  doc.circle(badgeX, badgeY, badgeR).fill(GOLD);
  doc.font("CairoBold").fontSize(5.5).fillColor("#FFFFFF");
  doc.text(String(number), badgeX - badgeR, badgeY - 4, {
    width: badgeR * 2,
    align: "center",
    lineBreak: false,
  });

  if (showTicketIcon) drawTicketIcon(doc, x + 9, y + 7, 10);

  await drawArabicBlock(
    doc,
    await renderArabicText({
      text,
      widthPt: w - (showTicketIcon ? 24 : 14),
      fontSizePt: 4.8,
      align: "right",
      maxLines: 2,
    }),
    x,
    y + 1,
    w - 14
  );
}

async function drawCardBack(doc, x, y, { websiteQr }) {
  drawRoundedCardFrame(doc, x, y);

  const pad = 7;
  const innerX = x + pad;
  const innerW = CARD_PT - pad * 2;
  let cursorY = y + 5;

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: "ماذا يقدم Win Gold؟",
      widthPt: innerW,
      fontSizePt: 6.2,
      bold: true,
      maxLines: 1,
    }),
    innerX,
    cursorY,
    innerW
  ) + 3;

  const features = [
    [drawBagIcon, "العروض", "خصومات يومية"],
    [drawStarIcon, "النقاط", "اجمع واستبدل"],
    [drawStoreIcon, "السوق العام", "تسوّق بسهولة"],
    [drawTrophyIcon, "المسابقات", "اربح جوائز"],
  ];

  const featureColW = innerW / 2;
  for (let i = 0; i < features.length; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    await drawFeatureRow(
      doc,
      innerX + col * featureColW,
      cursorY + row * 14,
      featureColW - 2,
      features[i][0],
      features[i][1],
      features[i][2]
    );
  }
  cursorY += 31;

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: "طريقة الاستخدام",
      widthPt: innerW,
      fontSizePt: 5.8,
      bold: true,
      maxLines: 1,
    }),
    innerX,
    cursorY,
    innerW
  ) + 2;

  await drawStep(doc, innerX, cursorY, innerW, 1, "افتح تطبيق أو موقع Win Gold");
  cursorY += 12;
  await drawStep(doc, innerX, cursorY, innerW, 2, 'اضغط على أيقونة "إدخال الكود"', true);
  cursorY += 13;
  await drawStep(doc, innerX, cursorY, innerW, 3, "امسح رمز البطاقة أو أدخل الكود يدوياً");
  cursorY += 13;

  doc.save();
  doc.roundedRect(innerX, cursorY, innerW, 11, 3).fill("#FEF2F2");
  doc.restore();

  cursorY = drawArabicBlock(
    doc,
    await renderArabicText({
      text: "هذه البطاقة هدية مجانية\nغير قابلة للبيع أو الشراء",
      widthPt: innerW,
      fontSizePt: 4.6,
      color: RED_BRAND,
      bold: true,
      maxLines: 2,
    }),
    innerX,
    cursorY + 1,
    innerW
  ) + 2;

  const qrSize = 26;
  doc.image(websiteQr, x + (CARD_PT - qrSize) / 2, cursorY, { width: qrSize, height: qrSize });
  cursorY += qrSize + 1;

  drawArabicBlock(
    doc,
    await renderArabicText({
      text: "حمّل Win Gold",
      widthPt: innerW,
      fontSizePt: 4.4,
      color: TEXT_MUTED,
      maxLines: 1,
    }),
    innerX,
    cursorY,
    innerW
  );
}

function drawCropMarks(doc, x, y) {
  const mark = 6;
  const off = 3;
  doc.save();
  doc.lineWidth(0.35).strokeColor("#CBD5E1");

  doc.moveTo(x - off - mark, y).lineTo(x - off, y).stroke();
  doc.moveTo(x, y - off - mark).lineTo(x, y - off).stroke();
  doc.moveTo(x + CARD_PT + off, y).lineTo(x + CARD_PT + off + mark, y).stroke();
  doc.moveTo(x + CARD_PT, y - off - mark).lineTo(x + CARD_PT, y - off).stroke();
  doc.moveTo(x - off - mark, y + CARD_PT).lineTo(x - off, y + CARD_PT).stroke();
  doc.moveTo(x, y + CARD_PT + off).lineTo(x, y + CARD_PT + off + mark).stroke();
  doc.moveTo(x + CARD_PT + off, y + CARD_PT).lineTo(x + CARD_PT + off + mark, y + CARD_PT).stroke();
  doc.moveTo(x + CARD_PT, y + CARD_PT + off).lineTo(x + CARD_PT, y + CARD_PT + off + mark).stroke();

  doc.restore();
}

async function generateGiftCardPdf({ codes, storeName, websiteUrl }) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error("No gift codes supplied for PDF export");
  }

  const logo = await loadLogoBuffer();
  const websiteQr = await generateQrBuffer(websiteUrl, 420);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: "Win Gold Gift Cards",
        Author: "Win Gold",
        Subject: "Print-ready gift cards",
      },
    });

    try {
      ensureFonts(doc);
    } catch (err) {
      reject(err);
      return;
    }

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    (async () => {
      try {
        for (let pageStart = 0; pageStart < codes.length; pageStart += CARDS_PER_PAGE) {
          doc.addPage();
          const batch = codes.slice(pageStart, pageStart + CARDS_PER_PAGE);

          for (let slot = 0; slot < batch.length; slot += 1) {
            const pos = cardPosition(slot);
            const giftQr = await generateQrBuffer(
              buildGiftActivationUrl(websiteUrl, batch[slot]),
              640
            );
            await drawCardFront(doc, pos.x, pos.y, {
              storeName,
              code: batch[slot],
              giftQr,
              logo,
            });
            drawCropMarks(doc, pos.x, pos.y);
          }
        }

        for (let pageStart = 0; pageStart < codes.length; pageStart += CARDS_PER_PAGE) {
          doc.addPage();
          const batch = codes.slice(pageStart, pageStart + CARDS_PER_PAGE);

          for (let slot = 0; slot < batch.length; slot += 1) {
            const pos = cardPosition(slot);
            await drawCardBack(doc, pos.x, pos.y, { websiteQr });
            drawCropMarks(doc, pos.x, pos.y);
          }
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

module.exports = {
  generateGiftCardPdf,
};
