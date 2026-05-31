'use client'

import type { Tag } from '@crm/shared'

interface TagFilterProps {
  tags: Tag[]
  selectedTagId: string | null
  onSelect: (tagId: string | null) => void
}

export default function TagFilter({ tags, selectedTagId, onSelect }: TagFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-400">Tags:</span>
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
          selectedTagId === null
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
        }`}
      >
        Todos
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelect(selectedTagId === tag.id ? null : tag.id)}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            selectedTagId === tag.id
              ? 'text-white border-transparent'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
          style={selectedTagId === tag.id ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
        >
          {selectedTagId !== tag.id && (
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
          )}
          {tag.name}
        </button>
      ))}
    </div>
  )
}
