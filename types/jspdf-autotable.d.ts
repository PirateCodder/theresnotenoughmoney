import { jsPDF } from "jspdf";

declare module "jspdf-autotable" {
  interface UserOptions {
    startY?: number;
    head?: Array<Array<string>>;
    body?: Array<Array<string>>;
    foot?: Array<Array<string>>;
    theme?: "striped" | "grid" | "plain" | "css";
    styles?: Record<string, unknown>;
    headStyles?: Record<string, unknown>;
    bodyStyles?: Record<string, unknown>;
    footStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    columnStyles?: Record<number, Record<string, unknown>>;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    didDrawPage?: (data: { pageNumber: number; pageCount: number; table: unknown }) => void;
    didDrawCell?: (data: unknown) => void;
    willDrawCell?: (data: unknown) => void;
    [key: string]: unknown;
  }

  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}