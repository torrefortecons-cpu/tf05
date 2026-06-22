import { jsPDF } from 'jspdf';

export interface QuotationLineItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationPDFInput {
  id: string;
  docLabel?: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientNit?: string;
  clientRole?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: QuotationLineItem[];
  discountPct?: number;
  taxRatePct?: number;
  notes?: string;
  paymentTerms?: string;
}

const BLUE: [number, number, number] = [37, 99, 235];
const BLUE_BG: [number, number, number] = [239, 246, 255];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];
const SLATE_50: [number, number, number] = [248, 250, 252];
const BORDER: [number, number, number] = [226, 232, 240];
const EMERALD: [number, number, number] = [4, 120, 87];

const money = (n: number) => `$ ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateQuotationPDF(input: QuotationPDFInput): jsPDF {
  const doc = new jsPDF();
  doc.setFont('helvetica');

  const LEFT = 20;
  const RIGHT = 190;
  const WIDTH = RIGHT - LEFT;

  // --- HEADER: brand (left) + doc badge/number/dates (right) ---
  doc.setFillColor(...SLATE_700);
  doc.roundedRect(LEFT, 14, 14, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TF', LEFT + 7, 22.7, { align: 'center' });

  doc.setTextColor(...SLATE_900);
  doc.setFontSize(12.5);
  doc.text('Torre Forte S.R.L.', LEFT + 18, 19);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('NIT 349812024', LEFT + 18, 23);
  doc.text('Calle Florida #350, Santa Cruz de la Sierra, Bolivia', LEFT + 18, 26.5);
  doc.text('+591 750-11223  ·  ventas@torreforte.bo  ·  www.torreforte.bo', LEFT + 18, 30);

  const docLabel = input.docLabel || 'COTIZACIÓN COMERCIAL';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const labelWidth = doc.getTextWidth(docLabel) + 8;
  doc.setFillColor(...BLUE);
  doc.roundedRect(RIGHT - labelWidth, 14, labelWidth, 6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(docLabel, RIGHT - labelWidth / 2, 18.2, { align: 'center' });

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(input.id, RIGHT, 26.5, { align: 'right' });

  const metaRow = (label: string, value: string, y: number) => {
    doc.setFontSize(7.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_400);
    doc.text(label, RIGHT - 42, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_700);
    doc.text(value, RIGHT, y, { align: 'right' });
  };
  metaRow('Fecha de Creación:', input.date, 31);
  metaRow('Validez hasta:', input.validUntil || '30 días desde emisión', 35);
  metaRow('Divisa Oficial:', 'Bs. (BOB)', 39);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(LEFT, 44, RIGHT, 44);

  // --- EMISOR / CLIENTE PANEL ---
  const panelY = 49;
  const panelH = 33;
  doc.setFillColor(...SLATE_50);
  doc.roundedRect(LEFT, panelY, WIDTH, panelH, 2, 2, 'F');
  doc.setDrawColor(...BORDER);
  doc.line(LEFT + WIDTH / 2, panelY + 4, LEFT + WIDTH / 2, panelY + panelH - 4);

  const col1X = LEFT + 5;
  const col2X = LEFT + WIDTH / 2 + 5;
  const colW2 = WIDTH / 2 - 10;

  doc.setFontSize(6.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_400);
  doc.text('EMISOR DE PROPUESTA:', col1X, panelY + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_900);
  doc.text('Torre Forte S.R.L.', col1X, panelY + 11);
  doc.setFontSize(7.1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('Contacto Directo: ventas@torreforte.bo', col1X, panelY + 16);
  doc.text('Línea de Atención: +591 750-11223', col1X, panelY + 20.5);

  doc.setFontSize(6.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('DIRIGIDO A:', col2X, panelY + 6);
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  doc.text(input.clientName || 'Público General', col2X, panelY + 11.5);
  doc.setFontSize(7.1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(`NIT / CI: ${input.clientNit || 'Particular (S/N)'}`, col2X, panelY + 15.5);
  doc.text(`Atención: ${input.clientRole || 'Cliente / Particular'}`, col2X, panelY + 19.5);
  const addrLines = doc.splitTextToSize(`Dirección: ${input.clientAddress || 'Santa Cruz, Bolivia'}`, colW2);
  doc.text(addrLines, col2X, panelY + 23.5);
  doc.text(`Medio: ${input.clientPhone || '-'}  ·  ${input.clientEmail || '-'}`, col2X, panelY + 28.5);

  // --- ITEMS TABLE ---
  const colNumX = LEFT + 5;
  const colDescX = LEFT + 12;
  const colDescW = 88;
  const colQtyX = LEFT + 118;
  const colPriceX = LEFT + 148;
  const colTotalX = RIGHT;

  let tableY = panelY + panelH + 8;
  doc.setFillColor(...BLUE);
  doc.rect(LEFT, tableY, WIDTH, 7, 'F');
  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('#', colNumX, tableY + 4.6, { align: 'center' });
  doc.text('CONCEPTO / DESCRIPCIÓN', colDescX, tableY + 4.6);
  doc.text('CANT.', colQtyX, tableY + 4.6, { align: 'center' });
  doc.text('PRECIO UNIT.', colPriceX, tableY + 4.6, { align: 'right' });
  doc.text('TOTAL PARCIAL', colTotalX, tableY + 4.6, { align: 'right' });

  let rowY = tableY + 7;
  input.items.forEach((it, idx) => {
    const descLines = it.description ? doc.splitTextToSize(it.description, colDescW) : [];
    const rowH = Math.max(13, 7 + descLines.length * 3.6);

    if (idx % 2 === 1) {
      doc.setFillColor(...SLATE_50);
      doc.rect(LEFT, rowY, WIDTH, rowH, 'F');
    }

    doc.setFontSize(7.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text((idx + 1).toString().padStart(2, '0'), colNumX, rowY + 6, { align: 'center' });

    doc.setFontSize(8.3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_900);
    const splitName = doc.splitTextToSize(it.name, colDescW);
    doc.text(splitName, colDescX, rowY + 6);

    if (descLines.length) {
      doc.setFontSize(6.6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_400);
      doc.text(descLines, colDescX, rowY + 10);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_700);
    doc.text(it.quantity.toString(), colQtyX, rowY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(money(it.unitPrice), colPriceX, rowY + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_900);
    doc.text(money(it.unitPrice * it.quantity), colTotalX, rowY + 6, { align: 'right' });

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(LEFT, rowY + rowH, RIGHT, rowY + rowH);

    rowY += rowH;
  });

  // --- TOTALS & CONDITIONS ---
  const subtotal = input.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountPct = input.discountPct || 0;
  const discountVal = subtotal * (discountPct / 100);
  const taxBase = subtotal - discountVal;
  const taxRate = input.taxRatePct || 0;
  const taxVal = taxBase * (taxRate / 100);
  const grandTotal = taxBase + taxVal;

  const sectionY = rowY + 9;
  const leftColW = (WIDTH * 7) / 12 - 4;

  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text('CONDICIONES DE RECIBO & TIEMPOS:', LEFT, sectionY);
  doc.setFontSize(7.1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  const termsText = input.paymentTerms || '50% de anticipo y 50% facturado contra entrega técnica conforme a bitácora de obra.';
  const termsLines = doc.splitTextToSize(termsText, leftColW);
  doc.text(termsLines, LEFT, sectionY + 4.5);

  const bankY = sectionY + 4.5 + termsLines.length * 3.6 + 4;
  doc.setFillColor(...SLATE_50);
  doc.roundedRect(LEFT, bankY, leftColW, 15, 1.5, 1.5, 'F');
  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text('CANALES DE PAGO HABILITADOS:', LEFT + 3, bankY + 5);
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_700);
  const bankLines = doc.splitTextToSize('Banco Mercantil Santa Cruz · Cuenta Corriente Bs: 4010-99321-2 (Titular: Torre Forte S.R.L.)', leftColW - 6);
  doc.text(bankLines, LEFT + 3, bankY + 9.5);

  const totalsX = RIGHT;
  const totalsLabelX = RIGHT - 65;
  let totalsY = sectionY;
  const totalRow = (label: string, value: string, color: [number, number, number] = SLATE_700) => {
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...color);
    doc.text(label, totalsLabelX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE_900);
    doc.text(value, totalsX, totalsY, { align: 'right' });
    totalsY += 6;
  };

  totalRow('Subtotal Rubros:', money(subtotal));
  if (discountPct > 0) totalRow(`Descuento (${discountPct}%):`, `- ${money(discountVal)}`, EMERALD);
  if (discountPct > 0) totalRow('Base de Impuesto:', money(taxBase));
  doc.setDrawColor(...BORDER);
  doc.line(totalsLabelX, totalsY - 2, totalsX, totalsY - 2);
  totalRow(`Impuestos (IVA ${taxRate}%):`, money(taxVal));

  doc.setFillColor(...BLUE_BG);
  doc.roundedRect(totalsLabelX, totalsY, totalsX - totalsLabelX, 9, 1.5, 1.5, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_900);
  doc.text('TOTAL:', totalsLabelX + 3, totalsY + 6);
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text(money(grandTotal), totalsX - 3, totalsY + 6, { align: 'right' });
  totalsY += 9;

  // --- NOTES ---
  const notesY = Math.max(bankY + 19, totalsY + 8);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(LEFT, notesY, WIDTH, 15);
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text('Observaciones Generales:', LEFT + 3, notesY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  const notesText = input.notes || 'Validez de la propuesta sujeta a confirmación de stock y a la fecha de vencimiento indicada.';
  const splitNotes = doc.splitTextToSize(notesText, WIDTH - 6);
  doc.text(splitNotes, LEFT + 3, notesY + 9.5);

  // --- SIGNATURES ---
  const sigY = notesY + 28;
  const sigColW = 60;

  doc.setDrawColor(...BORDER);
  doc.line(LEFT + 10, sigY, LEFT + 10 + sigColW, sigY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text('Torre Forte S.R.L.', LEFT + 10 + sigColW / 2, sigY - 2, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...SLATE_700);
  doc.text('REPRESENTANTE COMERCIAL', LEFT + 10 + sigColW / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_400);
  doc.text('Torre Forte S.R.L.', LEFT + 10 + sigColW / 2, sigY + 9, { align: 'center' });

  const sig2X = RIGHT - 10 - sigColW;
  doc.line(sig2X, sigY, sig2X + sigColW, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...SLATE_700);
  doc.text('ACEPTADO POR CLIENTE', sig2X + sigColW / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_400);
  doc.text('Fecha de Firma y Sello Receptor', sig2X + sigColW / 2, sigY + 9, { align: 'center' });

  return doc;
}
