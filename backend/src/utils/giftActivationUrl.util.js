function getCustomerAppUrl() {
  return (process.env.CUSTOMER_APP_URL || "https://winzor.netlify.app").replace(/\/$/, "");
}

function buildGiftActivationUrl(websiteUrl, code) {
  const base = String(websiteUrl || "").replace(/\/$/, "");
  return `${base}/?gift=${encodeURIComponent(code)}`;
}

module.exports = {
  getCustomerAppUrl,
  buildGiftActivationUrl,
};
