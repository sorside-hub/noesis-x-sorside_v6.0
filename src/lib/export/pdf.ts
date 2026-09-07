import { FileNode } from '../../types/vault';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeFilename } from './utils';
import { parseMarkdownToHTML } from './markdown';

/**
 * Export note as high-quality, smart-paginated PDF using discrete A4 page rendering
 * Solves arbitrary line cutoffs by typesetting content into discrete A4 pages with orphan protection
 */
export async function exportNoteAsPDF(node: FileNode): Promise<void> {
  // Yield to main thread first so UI spinner renders immediately without freezing
  await new Promise((resolve) => setTimeout(resolve, 60));

  const title = node.name || 'Untitled';
  const rawContent = node.content || '';
  const updatedDate = node.updatedAt ? new Date(node.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '';
  const tagsHtml = node.metadata?.tags && node.metadata.tags.length > 0
    ? `<div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px;">${node.metadata.tags.map(t => `<span style="background-color: #F4F4F5; color: #D97706; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">#${t}</span>`).join(' ')}</div>`
    : '';

  // Setup isolated measuring/rendering sandbox iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Tidak dapat mengakses dokumen iframe untuk export PDF');
    }

    // CSS Styling for the pages
    const pageStyles = `
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        background-color: #E2E8F0;
        color: #18181B;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        width: 794px;
      }
      .pdf-page {
        width: 794px;
        height: 1123px;
        max-height: 1123px;
        padding: 44px 48px 52px 48px;
        background-color: #FFFFFF;
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
        box-sizing: border-box;
      }
      .pdf-page-content {
        width: 100%;
        box-sizing: border-box;
        /* Natural height for accurate typesetting */
      }
      .pdf-page-footer {
        position: absolute;
        bottom: 20px;
        left: 48px;
        right: 48px;
        height: 22px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #E4E4E7;
        padding-top: 5px;
        font-size: 10px;
        color: #A1A1AA;
        box-sizing: border-box;
      }
      .pdf-doc-title {
        font-size: 22px;
        font-weight: 800;
        color: #09090B;
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
      }
      .pdf-date-meta {
        font-size: 11px;
        color: #71717A;
        margin-bottom: 10px;
      }
      .pdf-divider {
        border: 0;
        border-top: 1px solid #E4E4E7;
        margin: 8px 0 16px 0;
      }
      h1 {
        font-size: 18px;
        font-weight: 800;
        color: #09090B;
        margin-top: 16px;
        margin-bottom: 8px;
        line-height: 1.3;
      }
      h2 {
        font-size: 15px;
        font-weight: 700;
        color: #18181B;
        margin-top: 14px;
        margin-bottom: 6px;
        line-height: 1.35;
      }
      h3 {
        font-size: 13.5px;
        font-weight: 600;
        color: #27272A;
        margin-top: 12px;
        margin-bottom: 4px;
      }
      p {
        margin-top: 0;
        margin-bottom: 4px;
        font-size: 12px;
        color: #27272A;
        line-height: 1.55;
      }
      p:last-child {
        margin-bottom: 0;
      }
      .pdf-list-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        margin-top: 0 !important;
        margin-bottom: 3px !important;
        line-height: 1.55 !important;
        padding-left: 8px !important;
      }
      .pdf-list-bullet {
        width: 14px !important;
        min-width: 14px !important;
        max-width: 14px !important;
        font-size: 11px !important; /* Smaller size so geometric shapes fit nicely */
        line-height: 18.6px !important; /* Exact match to 12px * 1.55 line height */
        padding-top: 0px !important;
        color: #18181B !important;
        flex-shrink: 0 !important;
        text-align: left !important;
        user-select: none !important;
      }
      .pdf-list-num {
        min-width: 18px !important;
        font-weight: 600 !important;
        font-size: 12px !important;
        line-height: 1.55 !important;
        color: #334155 !important;
        flex-shrink: 0 !important;
        margin-right: 4px !important;
        text-align: left !important;
        user-select: none !important;
      }
      .pdf-list-content {
        flex: 1 !important;
        font-size: 12px !important;
        color: #27272A !important;
        line-height: 1.55 !important;
        min-width: 0 !important;
      }
      .pdf-list-content p, .pdf-list-content > p {
        display: inline !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: inherit !important;
      }
      blockquote {
        border-left: 3.5px solid #D97706;
        padding-left: 12px;
        margin: 10px 0;
        color: #52525B;
        font-style: italic;
        font-size: 12px;
      }
      code {
        background-color: #F4F4F5;
        color: #D97706;
        padding: 1px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 11px;
      }
      pre {
        background-color: #F4F4F5;
        border: 1px solid #E4E4E7;
        padding: 10px;
        border-radius: 6px;
        margin: 8px 0;
        font-size: 11px;
      }
      pre code {
        background: transparent;
        color: #18181B;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 11.5px;
      }
      th, td {
        border: 1px solid #E4E4E7;
        padding: 6px 8px;
        text-align: left;
      }
      th {
        background-color: #F4F4F5;
        font-weight: 600;
      }
    `;

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><style>${pageStyles}</style></head><body><div id="pages-container"></div></body></html>`);
    iframeDoc.close();

    await new Promise(r => setTimeout(r, 40));

    // Staging / parsing HTML elements from markdown
    const parsedHtml = parseMarkdownToHTML(rawContent);
    const tempContainer = iframeDoc.createElement('div');
    tempContainer.innerHTML = parsedHtml;
    const rawElements = Array.from(tempContainer.children) as HTMLElement[];

    // Usable vertical printable height in px per A4 page:
    // 1123px (A4 full height) - 44px (padding top) - 52px (padding bottom) - 22px (footer) = ~1005px
    const MAX_PAGE_CONTENT_HEIGHT = 1005;

    const pages: HTMLElement[] = [];
    const pagesContainer = iframeDoc.getElementById('pages-container') || iframeDoc.body;

    const createNewPage = (): { pageEl: HTMLElement; contentEl: HTMLElement } => {
      const pageEl = iframeDoc.createElement('div');
      pageEl.className = 'pdf-page';

      const contentEl = iframeDoc.createElement('div');
      contentEl.className = 'pdf-page-content';
      pageEl.appendChild(contentEl);

      pagesContainer.appendChild(pageEl);
      pages.push(pageEl);
      return { pageEl, contentEl };
    };

    // Initialize Page 1
    let { contentEl: currentContent } = createNewPage();

    // Add Header on Page 1
    const headerWrapper = iframeDoc.createElement('div');
    headerWrapper.innerHTML = `
      <h1 class="pdf-doc-title">${title}</h1>
      <div class="pdf-date-meta">${updatedDate ? `Terakhir diperbarui: ${updatedDate} • ` : ''}Dibuat dengan Noesis</div>
      ${tagsHtml}
      <hr class="pdf-divider" />
    `;
    currentContent.appendChild(headerWrapper);

    // Recursive function to flatten lists into custom flex rows with proper indentation
    const processListForPDF = (listEl: HTMLElement, depth: number): HTMLElement[] => {
      const isOrdered = listEl.tagName === 'OL';
      const startAttr = listEl.getAttribute('start');
      let startNum = startAttr ? parseInt(startAttr, 10) : 1;
      if (isNaN(startNum)) startNum = 1;

      const items: HTMLElement[] = [];
      const listChildren = Array.from(listEl.children) as HTMLElement[];

      listChildren.forEach((li, idx) => {
        if (li.tagName !== 'LI') return;

        const row = iframeDoc.createElement('div');
        row.className = 'pdf-list-row';
        // Add 24px left margin per depth level for symmetrical hierarchy
        row.style.marginLeft = `${depth * 24}px`;

        const marker = iframeDoc.createElement('div');
        if (isOrdered) {
          marker.className = 'pdf-list-num';
          marker.textContent = `${startNum + idx}.`;
        } else {
          marker.className = 'pdf-list-bullet';
          // Alternate bullets based on hierarchy depth
          marker.textContent = depth % 3 === 0 ? '•' : (depth % 3 === 1 ? '○' : '■');
        }

        const content = iframeDoc.createElement('div');
        content.className = 'pdf-list-content';

        // Separate text content from nested lists
        const childNodes = Array.from(li.childNodes);
        const textNodes: Node[] = [];
        const nestedLists: HTMLElement[] = [];

        childNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && ((node as HTMLElement).tagName === 'UL' || (node as HTMLElement).tagName === 'OL')) {
            nestedLists.push(node as HTMLElement);
          } else {
            textNodes.push(node);
          }
        });

        // Add text nodes to content wrapper
        textNodes.forEach(node => content.appendChild(node.cloneNode(true)));
        
        // Ensure empty content doesn't break flex layout
        if (content.innerHTML.trim() === '') {
           content.innerHTML = '&nbsp;';
        }

        row.appendChild(marker);
        row.appendChild(content);
        items.push(row);

        // Recursively process nested lists and append them immediately after their parent row
        nestedLists.forEach(nestedList => {
          items.push(...processListForPDF(nestedList, depth + 1));
        });
      });

      return items;
    };

    // Expand and normalize elements (converting lists to robust custom flex rows for pixel-perfect PDF rendering)
    const flattenedElements: HTMLElement[] = [];
    for (const el of rawElements) {
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        flattenedElements.push(...processListForPDF(el, 0));
      } else {
        flattenedElements.push(el);
      }
    }

    // Typeset elements across pages with smart orphan & heading protection
    for (let i = 0; i < flattenedElements.length; i++) {
      const el = flattenedElements[i];
      const isHeading = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName);

      // Check current height if we append this element
      currentContent.appendChild(el);
      const currentHeight = currentContent.offsetHeight;

      if (currentHeight > MAX_PAGE_CONTENT_HEIGHT) {
        // Element doesn't fit on this page!
        currentContent.removeChild(el);

        // Start a fresh new page
        const newPage = createNewPage();
        currentContent = newPage.contentEl;

        // Place on the new page
        currentContent.appendChild(el);
      } else if (isHeading) {
        // Orphan Protection: Check if heading is too close to bottom of the page
        // (needs room for at least heading + subsequent paragraph, ~90px buffer)
        if (currentHeight > MAX_PAGE_CONTENT_HEIGHT - 90) {
          currentContent.removeChild(el);
          const newPage = createNewPage();
          currentContent = newPage.contentEl;
          currentContent.appendChild(el);
        }
      }
    }

    // Add footer to all created pages
    const totalPages = pages.length;
    for (let p = 0; p < totalPages; p++) {
      const footerEl = iframeDoc.createElement('div');
      footerEl.className = 'pdf-page-footer';
      footerEl.innerHTML = `
        <span>${title} • Noesis</span>
        <span>Halaman ${p + 1} dari ${totalPages}</span>
      `;
      pages[p].appendChild(footerEl);
    }

    // Render each A4 page canvas individually and compile into PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let p = 0; p < pages.length; p++) {
      const pageEl = pages[p];
      const canvas = await html2canvas(pageEl, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      if (p > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const filename = `${sanitizeFilename(title)}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
