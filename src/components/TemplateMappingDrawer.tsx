import React, { useState } from 'react';
import { TEMPLATE_PAGES_MAP, TEMPLATE_PAGES_MAP_FOUNDATIONAL } from '../lib/storage';
import { TemplatePageMap } from '../types/academic';
import { FileText, Search, CheckCircle, Sliders, X, Sparkles, BookOpen, Layers } from 'lucide-react';

interface TemplateMappingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  templatePages?: TemplatePageMap[];
  diaryMode?: 'middle-secondary' | 'foundational-preparatory';
}

export const TemplateMappingDrawer: React.FC<TemplateMappingDrawerProps> = ({
  isOpen,
  onClose,
  templatePages,
  diaryMode = 'middle-secondary'
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const pagesToUse = templatePages || (diaryMode === 'foundational-preparatory' ? TEMPLATE_PAGES_MAP_FOUNDATIONAL : TEMPLATE_PAGES_MAP);
  const totalPageCount = diaryMode === 'foundational-preparatory' ? 34 : 52;
  const isFoundational = diaryMode === 'foundational-preparatory';

  const filteredPages = pagesToUse.filter(p => {
    const matchesSearch =
      p.sectionTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.digitalModule.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      `page ${p.pageNo}`.includes(search.toLowerCase());

    const matchesType = filterType === 'all' || p.autoFillStatus === filterType;
    return matchesSearch && matchesType;
  });

  const autoFilledCount = pagesToUse.filter(p => p.autoFillStatus === 'Auto-Filled').length;
  const calculatedCount = pagesToUse.filter(p => p.autoFillStatus === 'Calculated').length;

  return (
    <div className="td-modal">
      <div className="td-modal-body max-w-4xl max-h-[92vh]">
        <div className={`td-modal-head border-b ${isFoundational ? 'bg-indigo-950/80 border-indigo-500/30' : 'bg-purple-950/80 border-purple-500/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isFoundational ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'}`}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-purple-100 m-0">
                {isFoundational 
                  ? "KVS Foundational & Preparatory Teacher's Diary Template Inspector (34 Pages)"
                  : "KVS Middle & Secondary Teacher's Diary Template Inspector (52 Pages)"}
              </h2>
              <p className="text-xs text-purple-300/70 m-0">
                Developer Mode: Complete mapping of Kendriya Vidyalaya NEP-2020 / NIPUN Bharat pages to app database entities
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-300/60" />
              <input
                type="text"
                placeholder="Search page number, section title, or digital module..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-100 placeholder-purple-300/40"
              />
            </div>

            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-300 shrink-0" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="py-2 px-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200"
              >
                <option value="all">All Field Types</option>
                <option value="Auto-Filled">Auto-Filled Fields</option>
                <option value="Manual Input">Manual Input Fields</option>
                <option value="Calculated">Calculated / Auto-Computed</option>
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border text-center ${isFoundational ? 'bg-indigo-900/30 border-indigo-500/20' : 'bg-purple-900/30 border-purple-500/20'}`}>
              <div className="text-[10px] uppercase font-bold text-purple-300">Total PDF Pages</div>
              <div className="font-serif text-lg font-bold text-white">{totalPageCount} Pages</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-300">Auto-Filled Sections</div>
              <div className="font-serif text-lg font-bold text-emerald-200">{autoFilledCount} Pages</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-center">
              <div className="text-[10px] uppercase font-bold text-blue-300">Calculated / Mapped</div>
              <div className="font-serif text-lg font-bold text-blue-200">{calculatedCount} Pages</div>
            </div>
          </div>

          {/* Mapping Directory List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredPages.map(page => (
              <div
                key={page.pageNo}
                className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 hover:border-purple-400/40 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isFoundational ? 'bg-indigo-900/60 border-indigo-400/30 text-indigo-200' : 'bg-purple-900/60 border-purple-400/30 text-purple-200'
                  }`}>
                    P-{page.pageNo}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-purple-100 flex items-center gap-2">
                      <span>{page.sectionTitle}</span>
                    </div>
                    <div className="text-xs text-purple-300/70 mt-0.5">
                      {page.description}
                    </div>
                    <div className="text-[11px] text-purple-400 font-mono mt-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-purple-400" />
                      <span>Module: {page.digitalModule}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      page.autoFillStatus === 'Auto-Filled'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : page.autoFillStatus === 'Calculated'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        : 'bg-purple-900 text-purple-200 border border-purple-400/30'
                    }`}
                  >
                    {page.autoFillStatus}
                  </span>
                  <span className="text-[10px] text-purple-300/60">{page.pageType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`td-modal-foot justify-between border-t ${isFoundational ? 'bg-indigo-950/80 border-indigo-500/30' : 'bg-purple-950/80 border-purple-500/30'}`}>
          <div className="text-xs text-purple-300/80 font-mono">
            Showing {filteredPages.length} of {totalPageCount} PDF Template Page Specs
          </div>
          <button onClick={onClose} className="td-btn-ghost text-xs">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

