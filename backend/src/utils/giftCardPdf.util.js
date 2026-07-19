/**
 * Premium printable gift-card PDF generator (A4 sheets, 300 DPI QR assets).
 * Replaces the legacy Excel export — gift/QR generation logic stays unchanged upstream.
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const sharp = require("sharp");

const MM_TO_PT = 72 / 25.4;
const CARD_MM = 60;
const CARD_PT = CARD_MM * MM_TO_PT;
const MARGIN_MM = 10;
const GAP_MM = 5;
const MARGIN_PT = MARGIN_MM * MM_TO_PT;
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
const FONT_REGULAR = path.join(FONT_DIR, "cairo-arabic-400-normal.woff");
const FONT_BOLD = path.join(FONT_DIR, "cairo-arabic-700-normal.woff");
const LOGO_PATH = path.join(__dirname, "../../assets/brand/win-goldenstore-logo.png");
const FALLBACK_LOGO_PATH = path.join(
  __dirname,
  "../../../store-supplier-frontend/assets/logo/win-goldenstore-logo-store.png"
);

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  type: "png",
  margin: 2,
  color: { dark: "#000000", light: "#FFFFFF" },
};

let logoCache = null;
let fontsReady = false;

function ensureFonts(doc) {
  if (fontsReady) return;
  doc.registerFont("Cairo", FONT_REGULAR);
  doc.registerFont("CairoBold", FONT_BOLD);
  fontsReady = true;
}

async function loadLogoBuffer() {
  if (logoCache) return logoCache;

  const logoPath = fs.existsSync(LOGO_PATH)
    ? LOGO_PATH
    : fs.existsSync(FALLBACK_LOGO_PATH)
      ? FALLBACK_LOGO_PATH
      : null;

  if (!logoPath) {
    logoCache = null;
    return null;
  }

  logoCache = await sharp(logoPath)
    .resize(220, 220, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return logoCache;
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
  doc.font("CairoBold").fontSize(78);
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

function drawCenteredText(doc, text, x, y, width, opts = {}) {
  doc.text(text, x, y, {
    width,
    align: "center",
    lineBreak: false,
    ...opts,
  });
}

function drawCardFront(doc, x, y, { storeName, code, giftQr, logo }) {
  drawRoundedCardFrame(doc, x, y);

  const pad = 8;
  const innerW = CARD_PT - pad * 2;
  let cursorY = y + 5;

  if (logo) {
    const logoW = 38;
    const logoH = 38;
    const logoX = x + (CARD_PT - logoW) / 2;
    doc.image(logo, logoX, cursorY, { width: logoW, height: logoH, fit: [logoW, logoH] });
    cursorY += logoH + 2;
  } else {
    doc.font("CairoBold").fontSize(10).fillColor(GOLD);
    drawCenteredText(doc, "Win Gold", x + pad, cursorY, innerW);
    cursorY += 13;
  }

  doc.font("Cairo").fontSize(6.4).fillColor(TEXT_MUTED);
  drawCenteredText(doc, "هدية مقدمة من", x + pad, cursorY, innerW);
  cursorY += 8;

  doc.font("CairoBold").fontSize(7.6).fillColor(TEXT_DARK);
  drawCenteredText(doc, storeName || "—", x + pad, cursorY, innerW);
  cursorY += 9;

  const qrSize = 64;
  doc.image(giftQr, x + (CARD_PT - qrSize) / 2, cursorY, { width: qrSize, height: qrSize });
  cursorY += qrSize + 3;

  doc.font("CairoBold").fontSize(8.4).fillColor(TEXT_DARK);
  drawCenteredText(doc, code, x + pad, cursorY, innerW);
  cursorY += 10;

  doc.font("Cairo").fontSize(5.6).fillColor(GOLD);
  drawCenteredText(doc, "ابدأ رحلتك مع Win Gold وكن أول فائز", x + pad, cursorY, innerW);
  cursorY += 7;

  drawCameraIcon(doc, x + CARD_PT / 2, cursorY + 4, 7);
  cursorY += 10;
  doc.font("Cairo").fontSize(5.1).fillColor(TEXT_MUTED);
  drawCenteredText(doc, "امسح هذا الرمز من داخل تطبيق Win Gold", x + pad, cursorY, innerW);
  cursorY += 6;
  drawCenteredText(doc, "الطريقة في الخلف", x + pad, cursorY, innerW);
}

function drawCameraIcon(doc, cx, cy, size) {
  const w = size * 1.5;
  const h = size;
  const x = cx - w / 2;
  const y = cy - h / 2;

  doc.save();
  doc.roundedRect(x, y, w, h, 1.5).lineWidth(0.6).strokeColor(TEXT_MUTED).stroke();
  doc.circle(cx, cy, size * 0.28).lineWidth(0.6).strokeColor(TEXT_MUTED).stroke();
  doc.restore();
}

function drawFeatureRow(doc, x, y, w, drawIcon, label, desc) {
  drawIcon(doc, x + w - 8, y + 4, 6);
  doc.font("CairoBold").fontSize(5.8).fillColor(TEXT_DARK);
  doc.text(label, x, y, { width: w - 10, align: "right", lineBreak: false });
  doc.font("Cairo").fontSize(4.8).fillColor(TEXT_MUTED);
  doc.text(desc, x, y + 6, { width: w - 10, align: "right", lineBreak: false });
}

function drawBagIcon(doc, cx, cy, s) {
  doc.save();
  doc.moveTo(cx - s, cy - s * 0.2).lineTo(cx - s * 0.7, cy - s).lineTo(cx + s * 0.7, cy - s).lineTo(cx + s, cy - s * 0.2).lineWidth(0.55).strokeColor(GOLD).stroke();
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
  doc.moveTo(cx, cy - s).lineTo(cx + s, cy).lineTo(cx + s, cy + s).lineTo(cx - s, cy + s).lineTo(cx - s, cy).closePath().lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.rect(cx - s * 0.35, cy, s * 0.7, s * 0.55).lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.restore();
}

function drawTrophyIcon(doc, cx, cy, s) {
  doc.save();
  doc.moveTo(cx - s * 0.8, cy - s).lineTo(cx + s * 0.8, cy - s).lineTo(cx + s * 0.5, cy).lineTo(cx + s * 0.2, cy).lineTo(cx + s * 0.2, cy + s * 0.7).lineTo(cx - s * 0.2, cy + s * 0.7).lineTo(cx - s * 0.2, cy).lineTo(cx - s * 0.5, cy).closePath().lineWidth(0.55).strokeColor(GOLD).stroke();
  doc.restore();
}

function drawTicketIcon(doc, cx, cy, size) {
  const w = size;
  const h = size * 0.72;
  const x = cx - w / 2;
  const y = cy - h / 2;

  doc.save();
  doc.roundedRect(x, y, w, h, 2).lineWidth(0.8).strokeColor(RED_BRAND).stroke();
  doc.moveTo(x + w * 0.28, y).lineTo(x + w * 0.28, y + h).strokeColor(RED_SOFT).stroke();
  doc.circle(x + w * 0.28, y + h * 0.22, 1.6).fill("#FFFFFF");
  doc.circle(x + w * 0.28, y + h * 0.78, 1.6).fill("#FFFFFF");
  doc.restore();
}

function drawStep(doc, x, y, w, number, text, showTicketIcon = false) {
  const badgeR = 5.5;
  const badgeX = x + w - badgeR;
  const badgeY = y + badgeR;

  doc.circle(badgeX, badgeY, badgeR).fill(GOLD);
  doc.font("CairoBold").fontSize(6).fillColor("#FFFFFF");
  drawCenteredText(doc, String(number), badgeX - badgeR, badgeY - 4, badgeR * 2);

  if (showTicketIcon) {
    drawTicketIcon(doc, x + 10, y + 8, 12);
    doc.font("Cairo").fontSize(5).fillColor(TEXT_DARK);
    doc.text(text, x + 20, y + 3, { width: w - 32, align: "right", lineGap: 0.5 });
    return;
  }

  doc.font("Cairo").fontSize(5).fillColor(TEXT_DARK);
  doc.text(text, x, y + 2, { width: w - 14, align: "right", lineGap: 0.5 });
}

function drawCardBack(doc, x, y, { websiteQr }) {
  drawRoundedCardFrame(doc, x, y);

  const pad = 8;
  const innerX = x + pad;
  const innerW = CARD_PT - pad * 2;
  let cursorY = y + 6;

  doc.font("CairoBold").fontSize(6.8).fillColor(TEXT_DARK);
  drawCenteredText(doc, "ماذا يقدم Win Gold؟", innerX, cursorY, innerW);
  cursorY += 10;

  const features = [
    [drawBagIcon, "العروض", "خصومات يومية"],
    [drawStarIcon, "النقاط", "اجمع واستبدل"],
    [drawStoreIcon, "السوق العام", "تسوّق بسهولة"],
    [drawTrophyIcon, "المسابقات", "اربح جوائز"],
  ];

  const featureColW = innerW / 2;
  features.forEach((feat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawFeatureRow(
      doc,
      innerX + col * featureColW,
      cursorY + row * 15,
      featureColW - 2,
      feat[0],
      feat[1],
      feat[2]
    );
  });
  cursorY += 34;

  doc.font("CairoBold").fontSize(6.4).fillColor(TEXT_DARK);
  drawCenteredText(doc, "طريقة الاستخدام", innerX, cursorY, innerW);
  cursorY += 8;

  drawStep(doc, innerX, cursorY, innerW, 1, "افتح تطبيق أو موقع Win Gold");
  cursorY += 13;
  drawStep(doc, innerX, cursorY, innerW, 2, 'اضغط على أيقونة "إدخال الكود"', true);
  cursorY += 15;
  drawStep(doc, innerX, cursorY, innerW, 3, "امسح رمز البطاقة أو أدخل الكود يدوياً");
  cursorY += 15;

  doc.save();
  doc.roundedRect(innerX, cursorY, innerW, 12, 3).fill("#FEF2F2");
  doc.restore();
  doc.font("CairoBold").fontSize(5.1).fillColor(RED_BRAND);
  drawCenteredText(doc, "هذه البطاقة هدية مجانية", innerX, cursorY + 1.5, innerW);
  drawCenteredText(doc, "غير قابلة للبيع أو الشراء", innerX, cursorY + 6.5, innerW);
  cursorY += 15;

  const qrSize = 28;
  doc.image(websiteQr, x + (CARD_PT - qrSize) / 2, cursorY, { width: qrSize, height: qrSize });
  cursorY += qrSize + 1;

  doc.font("Cairo").fontSize(4.6).fillColor(TEXT_MUTED);
  drawCenteredText(doc, "حمّل Win Gold", innerX, cursorY, innerW);
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

    ensureFonts(doc);

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
            drawCardFront(doc, pos.x, pos.y, {
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
            drawCardBack(doc, pos.x, pos.y, { websiteQr });
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
