export async function getBiologyPdfText() {
  const pdfPath = './Alyndrik.pdf';

  try {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error("📦 PDF library not loaded. Make sure you're online at least once.");
    }

    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;

    let text = '';
    const maxPages = Math.min(pdf.numPages, 3);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += `Page ${i}:\n${pageText}\n\n`;
    }

    return text;
  } catch (error) {
    console.error('Failed to load biology.pdf:', error);
    return "⚠️ Biology notes are not available. Please go online at least once to cache the content.";
  }
}