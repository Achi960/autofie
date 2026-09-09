// Client-side image watermarking using Canvas.
// Adds "Posted on AutoFie" + shop name to the bottom-right of each photo
// before uploading, so the watermark is baked into the stored file.

const MAX_DIM = 1600; // cap large photos so upload + page load stay fast

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function watermarkImage(file: File, shopName: string): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Skip animated/transparent formats where re-encoding would harm quality
  if (file.type === "image/gif") return file;

  try {
    const img = await loadImage(file);
    let { width, height } = { width: img.naturalWidth, height: img.naturalHeight };
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    // Watermark layout — proportional to the image's shorter side
    const base = Math.min(width, height);
    const padding = Math.max(12, Math.round(base * 0.025));
    const line1Size = Math.max(14, Math.round(base * 0.035));
    const line2Size = Math.max(16, Math.round(base * 0.045));
    const line1 = "Posted on AutoFie";
    const line2 = (shopName || "").trim();

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "right";

    // Measure
    ctx.font = `500 ${line1Size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const w1 = ctx.measureText(line1).width;
    ctx.font = `700 ${line2Size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const w2 = line2 ? ctx.measureText(line2).width : 0;

    const blockWidth = Math.max(w1, w2) + padding * 1.5;
    const blockHeight = line1Size + (line2 ? line2Size + padding * 0.4 : 0) + padding;
    const x = width - padding;
    const yBottom = height - padding;

    // Translucent dark backdrop for legibility on any photo
    const grad = ctx.createLinearGradient(0, yBottom - blockHeight - padding, 0, height);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(width - blockWidth - padding, yBottom - blockHeight, blockWidth + padding, blockHeight + padding);

    // Soft shadow
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = Math.max(3, Math.round(base * 0.006));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    if (line2) {
      ctx.font = `700 ${line2Size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line2, x, yBottom);
      ctx.font = `500 ${line1Size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(line1, x, yBottom - line2Size - padding * 0.4);
    } else {
      ctx.font = `600 ${line1Size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line1, x, yBottom);
    }

    // Always encode to JPEG: far smaller files, so listing photos load fast.
    const isPng = false;
    const mime = "image/jpeg";
    const quality = 0.82;

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mime, quality)
    );
    if (!blob) return file;

    const dot = file.name.lastIndexOf(".");
    const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
    const ext = isPng ? "png" : "jpg";
    return new File([blob], `${stem}.${ext}`, { type: mime, lastModified: Date.now() });
  } catch {
    // If anything goes wrong, fall back to the original file so uploads still succeed
    return file;
  }
}

export async function watermarkImages(files: File[], shopName: string): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await watermarkImage(f, shopName));
  return out;
}
