import React, { useState, useEffect } from 'react';
import { FileCode, Download, Play, Copy, Check, FileSpreadsheet, Settings, RefreshCw, Upload, FileType } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FormData, GeneratedCode, ColumnDef } from './types';
import { generateVbaScript } from './services/geminiService';
import { MappingBuilder } from './components/MappingBuilder';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCode | null>(null);
  const [copied, setCopied] = useState(false);
  
  // File Parsing State
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnDef[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    sourceSheetName: 'Data Source',
    templateSheetName: 'Form Letter',
    savePath: 'C:\\Users\\Client\\Documents\\Generated PDFs\\',
    startRow: 2,
    filenameColumn: 'A',
    mappings: [
      { id: '1', sourceColumn: 'B', targetCell: 'C5' },
      { id: '2', sourceColumn: 'C', targetCell: 'C6' },
    ]
  });

  // Extract columns when Source Sheet changes or Workbook loads
  useEffect(() => {
    if (!workbook || !formData.sourceSheetName) return;

    try {
      const sheet = workbook.Sheets[formData.sourceSheetName];
      if (!sheet) {
        setAvailableColumns([]);
        return;
      }

      // Parse range to get columns
      const range = XLSX.utils.decode_range(sheet['!ref'] || "A1");
      const cols: ColumnDef[] = [];

      // Iterate through columns (from Start Column to End Column) of Row 1
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: range.s.r }); // Assuming row 0 is header
        const cell = sheet[cellAddress];
        
        // Convert 0 -> A, 1 -> B, etc.
        const columnLetter = XLSX.utils.encode_col(C);
        
        if (cell && cell.v) {
          cols.push({ letter: columnLetter, header: String(cell.v) });
        } else {
          // Even if empty header, we might want to list the column letter
          cols.push({ letter: columnLetter, header: `(Empty Header)` });
        }
      }
      setAvailableColumns(cols);
    } catch (e) {
      console.error("Error parsing columns", e);
      setAvailableColumns([]);
    }
  }, [workbook, formData.sourceSheetName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer);
      
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      
      // Auto-select first sheet as source if available
      if (wb.SheetNames.length > 0) {
        setFormData(prev => ({ ...prev, sourceSheetName: wb.SheetNames[0] }));
      }
    } catch (error) {
      alert("Failed to parse file. Please ensure it is a valid CSV or Excel file.");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const generated = await generateVbaScript(formData);
      setResult(generated);
    } catch (error) {
      alert("Error generating code. Please check API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      {/* Sidebar / Configuration Panel */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-screen overflow-y-auto custom-scrollbar sticky top-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-600 p-2 rounded-lg">
            <FileSpreadsheet className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">VBA Auto-Gen</h1>
            <p className="text-xs text-slate-400">Excel Automation Assistant</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {/* File Upload Section */}
          <div className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
              <FileType size={12} /> Import Structure
            </h2>
            <div className="relative group">
               <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border border-dashed border-slate-700 bg-slate-800/50 rounded-lg p-4 text-center group-hover:bg-slate-800 transition-colors">
                {fileName ? (
                   <div className="flex items-center justify-center gap-2 text-green-400">
                     <FileSpreadsheet size={16} />
                     <span className="text-xs truncate max-w-[150px]">{fileName}</span>
                   </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Upload size={20} />
                    <span className="text-xs">Upload .xlsx or .csv</span>
                  </div>
                )}
              </div>
            </div>
            {fileName && (
              <p className="text-[10px] text-slate-500 text-center">
                Headers extracted for column mapping
              </p>
            )}
          </div>

          <div className="h-px bg-slate-800" />

          {/* Sheet Config */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
              <Settings size={12} /> Workbook Config
            </h2>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Source Sheet Name</label>
              <input
                type="text"
                list="sheet-names"
                name="sourceSheetName"
                value={formData.sourceSheetName}
                onChange={handleInputChange}
                autoComplete="off"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none transition-colors"
              />
              <datalist id="sheet-names">
                {sheetNames.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Template Sheet Name</label>
              <input
                type="text"
                list="sheet-names"
                name="templateSheetName"
                value={formData.templateSheetName}
                onChange={handleInputChange}
                autoComplete="off"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

             <div className="flex gap-4">
               <div className="space-y-1 w-1/2">
                <label className="text-xs text-slate-400">Data Start Row</label>
                <input
                  type="number"
                  name="startRow"
                  value={formData.startRow}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1 w-1/2">
                <label className="text-xs text-slate-400">Filename Col</label>
                <input
                  type="text"
                  list="column-options"
                  name="filenameColumn"
                  value={formData.filenameColumn}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
             </div>
          </div>

          <div className="h-px bg-slate-800 my-4" />

          {/* Mappings */}
          <MappingBuilder 
            mappings={formData.mappings} 
            setMappings={(newMappings) => setFormData(prev => ({ ...prev, mappings: typeof newMappings === 'function' ? newMappings(prev.mappings) : newMappings }))}
            availableColumns={availableColumns}
          />

          <div className="h-px bg-slate-800 my-4" />

          {/* Output Config */}
          <div className="space-y-4">
             <div className="space-y-1">
              <label className="text-xs text-slate-400">PDF Save Path</label>
              <input
                type="text"
                name="savePath"
                value={formData.savePath}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none transition-colors font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`mt-6 w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            loading 
              ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={18} /> Generating...
            </>
          ) : (
            <>
              <FileCode size={18} /> Generate Macro
            </>
          )}
        </button>
      </div>

      {/* Main Content / Code Display */}
      <div className="flex-1 p-6 md:p-10 h-screen overflow-y-auto custom-scrollbar bg-slate-950 relative">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
              <FileCode size={40} className="text-slate-700" />
            </div>
            <p className="text-lg font-medium">Configure your sheets and click Generate</p>
            <p className="text-sm max-w-md text-center text-slate-500">
              The AI will write a complete, error-handled VBA subroutine tailored to your exact cell mappings and file paths.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header for Results */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Generated VBA Solution</h2>
                <div className="flex gap-2 text-xs text-indigo-300 bg-indigo-900/30 px-3 py-1 rounded-full w-fit">
                   <Check size={14} /> Optimized for Excel 2016+
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition-colors"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Code Block */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Module1.bas</span>
                </div>
                <div className="overflow-x-auto p-4 custom-scrollbar">
                  <pre className="font-mono text-sm text-blue-100 leading-relaxed whitespace-pre">
                    <code>{result.code}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Play size={20} className="text-green-500" /> Implementation Guide
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-slate-400">
                <p className="whitespace-pre-line">{result.explanation}</p>
                <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800">
                  <h4 className="text-slate-200 font-medium mb-2">Quick Install:</h4>
                  <ol className="list-decimal list-inside space-y-1 marker:text-indigo-500">
                    <li>Open Excel Workbook.</li>
                    <li>Press <kbd className="bg-slate-800 px-1 rounded text-slate-300">Alt + F11</kbd> to open VBA Editor.</li>
                    <li>Go to <span className="text-indigo-400">Insert &gt; Module</span>.</li>
                    <li>Paste the code above.</li>
                    <li>Press <kbd className="bg-slate-800 px-1 rounded text-slate-300">F5</kbd> to run or attach to a button.</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default App;