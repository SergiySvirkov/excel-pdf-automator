export interface Mapping {
  id: string;
  sourceColumn: string;
  targetCell: string;
}

export interface FormData {
  sourceSheetName: string;
  templateSheetName: string;
  savePath: string;
  startRow: number;
  filenameColumn: string;
  mappings: Mapping[];
}

export interface GeneratedCode {
  code: string;
  explanation: string;
}

export interface ColumnDef {
  letter: string;
  header: string;
}