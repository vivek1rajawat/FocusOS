import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Renders a DOM element to a paginated A4 PDF and triggers a download.
export const exportElementToPdf = async (element, filename = 'FocusOS-Blueprint.pdf') => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: getComputedStyle(element).backgroundColor || '#ffffff',
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};
