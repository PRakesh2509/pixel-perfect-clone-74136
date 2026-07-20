// Client-side file text extraction for resumes and similar docs.
// Supports .txt, .md, .pdf, .docx

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return await file.text();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await (mammoth as any).extractRawText({ arrayBuffer });
    return value as string;
  }
  if (name.endsWith(".pdf")) {
    const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
    // Use bundled worker
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = (worker as any).default;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
    }
    return out.trim();
  }
  throw new Error("Unsupported file type. Upload .txt, .md, .pdf, or .docx");
}
