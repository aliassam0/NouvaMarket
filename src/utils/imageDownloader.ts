export async function downloadSingleImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Network error');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // Fallback if CORS or fetch fails
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export async function downloadAllImages(
  images: string[],
  productName: string,
  onShowToast?: (msg: string) => void
) {
  if (!images || images.length === 0) return;
  const cleanName = productName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').slice(0, 20) || 'product';

  if (onShowToast) {
    onShowToast(`📥 جاري بدء تحميل ${images.length} صورة للمنتج...`);
  }

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const ext = url.includes('.png') ? 'png' : 'jpg';
    const filename = `${cleanName}_${i + 1}.${ext}`;

    await downloadSingleImage(url, filename);
    await new Promise((res) => setTimeout(res, 350));
  }

  if (onShowToast) {
    onShowToast(`✔ تم تحميل جميع الصور بنجاح (${images.length} صور)`);
  }
}
