function parseDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:")) return null;
  const match = /^data:([^;]+);base64,(.+)$/i.exec(value);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

/** Replace stripped data URLs with a fetchable API path for list responses. */
function resolveListImageField(row, resource) {
  if (!row || typeof row !== "object") return row;
  const copy = { ...row };
  const id = String(copy._id);

  if (typeof copy.image === "string" && copy.image.startsWith("data:")) {
    copy.hasImage = true;
    copy.image = `/${resource}/${id}/image`;
  } else {
    copy.hasImage = !!copy.image;
  }

  return copy;
}

async function deliverStoredImage(res, image) {
  if (!image || typeof image !== "string") {
    return res.status(404).end();
  }

  if (image.startsWith("https://")) {
    return res.redirect(302, image);
  }

  const parsed = parseDataUrl(image);
  if (!parsed) {
    return res.status(404).end();
  }

  res.set("Cache-Control", "public, max-age=86400");
  return res.type(parsed.mime).send(parsed.buffer);
}

module.exports = {
  parseDataUrl,
  resolveListImageField,
  deliverStoredImage,
};
