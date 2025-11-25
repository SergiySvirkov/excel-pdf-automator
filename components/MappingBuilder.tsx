import React from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Mapping, ColumnDef } from '../types';

interface MappingBuilderProps {
  mappings: Mapping[];
  setMappings: React.Dispatch<React.SetStateAction<Mapping[]>>;
  availableColumns: ColumnDef[];
}

export const MappingBuilder: React.FC<MappingBuilderProps> = ({ mappings, setMappings, availableColumns }) => {
  const addMapping = () => {
    const newMapping: Mapping = {
      id: crypto.randomUUID(),
      sourceColumn: '',
      targetCell: ''
    };
    setMappings([...mappings, newMapping]);
  };

  const removeMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const updateMapping = (id: string, field: 'sourceColumn' | 'targetCell', value: string) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-300">Data Mapping</label>
        <button
          type="button"
          onClick={addMapping}
          className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
      
      {mappings.length === 0 && (
        <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
          No mappings defined. Click "Add Field" to map source columns to template cells.
        </div>
      )}

      {/* Datalist for column suggestions */}
      <datalist id="column-options">
        {availableColumns.map((col) => (
          <option key={col.letter} value={col.letter}>{col.header}</option>
        ))}
      </datalist>

      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {mappings.map((mapping, index) => (
          <div key={mapping.id} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
            <div className="flex-1">
              <input
                type="text"
                list="column-options"
                placeholder="Col (e.g., A)"
                value={mapping.sourceColumn}
                onChange={(e) => updateMapping(mapping.id, 'sourceColumn', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <ArrowRight size={16} className="text-slate-500" />
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cell (e.g., B2)"
                value={mapping.targetCell}
                onChange={(e) => updateMapping(mapping.id, 'targetCell', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => removeMapping(mapping.id)}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};