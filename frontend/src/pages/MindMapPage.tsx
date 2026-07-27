import { useState } from 'react';
import { BibleMindMap } from '../modules/bible-mindmap';

export function MindMapPage() {
  const [selectedVerse, setSelectedVerse] = useState('juan-3-16');

  const verseOptions = [
    { id: 'juan-3-16', label: 'Juan 3:16' },
    { id: 'romanos-5-8', label: 'Romanos 5:8' },
    { id: '1-juan-4-9', label: '1 Juan 4:9' },
    { id: 'mateo-24-14', label: 'Mateo 24:14' },
  ];

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">📖 Mapa Mental de Concordancia Bíblica (LBLA)</h1>
          <p className="text-indigo-100 mt-1">
            Explorar versículos, lemas Strong y referencias cruzadas de forma interactiva
          </p>

          {/* Verse Selector */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {verseOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedVerse(option.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedVerse === option.id
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <BibleMindMap key={selectedVerse} verseId={selectedVerse} />
      </div>
    </div>
  );
}
