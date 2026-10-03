/** Capture the visible document pages so PDF and preview share one layout. */
export async function downloadDocumentPdf(pages: HTMLElement[], filename: string) {
  // Snapshot before loading libraries: edits during export cannot mix revisions.
  const snapshot = document.createElement("div");
  snapshot.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:white;pointer-events:none;";
  snapshot.setAttribute("aria-hidden", "true");
  const copies = pages.map(page => {
    const copy = page.cloneNode(true) as HTMLElement;
    copy.style.boxShadow = "none";
    snapshot.appendChild(copy);
    return copy;
  });
  document.body.appendChild(snapshot);
  try {
    const [{ jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")]);
    await document.fonts.ready;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    for (let index = 0; index < copies.length; index++) {
      const page = copies[index];
      const canvas = await toCanvas(page, {
        pixelRatio: 2, backgroundColor: "#ffffff", skipFonts: true,
        width: page.offsetWidth, height: page.scrollHeight,
      });
      if (!canvas.width || !canvas.height) throw new Error("Empty document page");
      if (index > 0) pdf.addPage();
      // Long questions fit on their own A4 page without cutting off content.
      const scale = Math.min(210 / canvas.width, 297 / canvas.height);
      const width = canvas.width * scale;
      pdf.addImage(canvas, "PNG", (210 - width) / 2, 0, width, canvas.height * scale, undefined, "FAST");
      canvas.width = 0; canvas.height = 0;
    }
    pdf.save(filename);
  } finally {
    snapshot.remove();
  }
}
