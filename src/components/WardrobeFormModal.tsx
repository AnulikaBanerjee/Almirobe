import { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { WardrobeCollection } from '@/types';
import { isCustomCollection, type CategoryDraft } from '@/collections';
import { getWardrobeIcon, DEFAULT_ICONS } from '@/wardrobeIcons';

interface WardrobeFormModalProps {
  mode: 'create' | 'edit';
  collection?: WardrobeCollection;
  itemCount?: number;
  onClose: () => void;
  onCreate?: (collection: Omit<WardrobeCollection, 'id'>) => void;
  onUpdate?: (input: { name: string; icon: string; categoryDrafts: CategoryDraft[] }) => void;
  onDelete?: () => void;
}

function categoriesToDrafts(collection: WardrobeCollection): CategoryDraft[] {
  return collection.categories.map((category) => ({
    id: category.id,
    label: category.label,
  }));
}

export default function WardrobeFormModal({
  mode,
  collection,
  itemCount = 0,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: WardrobeFormModalProps) {
  const isEdit = mode === 'edit' && collection;
  const [name, setName] = useState(collection?.name ?? '');
  const [icon, setIcon] = useState(collection?.icon ?? 'package');
  const [categories, setCategories] = useState<CategoryDraft[]>(
    collection ? categoriesToDrafts(collection) : [{ label: '' }]
  );
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!collection) return;
    setName(collection.name);
    setIcon(collection.icon);
    setCategories(categoriesToDrafts(collection));
    setError('');
    setConfirmDelete(false);
  }, [collection]);

  const handleAddCategoryField = () => {
    setCategories((prev) => [...prev, { label: '' }]);
  };

  const handleCategoryChange = (index: number, value: string) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, label: value } : c)));
  };

  const handleRemoveCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): CategoryDraft[] | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a wardrobe name');
      return null;
    }
    const trimmedCategories = categories
      .map((c) => ({ ...c, label: c.label.trim() }))
      .filter((c) => c.label.length > 0);
    if (trimmedCategories.length === 0) {
      setError('Please add at least one category');
      return null;
    }
    setError('');
    return trimmedCategories;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCategories = validate();
    if (!trimmedCategories) return;

    if (isEdit && collection && onUpdate) {
      onUpdate({ name: name.trim(), icon, categoryDrafts: trimmedCategories });
      onClose();
      return;
    }

    if (onCreate) {
      onCreate({
        name: name.trim(),
        icon,
        categories: trimmedCategories.map((draft, index) => ({
          id: `${Date.now()}-${index}`,
          label: draft.label,
        })),
      });
      onClose();
    }
  };

  const inputClass =
    'w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all';
  const labelClass = 'block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider';

  const showDelete = isEdit && collection && isCustomCollection(collection) && onDelete;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h3 className="text-lg font-serif text-ink-50">
            {isEdit ? 'Edit Wardrobe' : 'Create a New Wardrobe'}
          </h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Wardrobe Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={inputClass}
              placeholder="e.g. Bags, Hats, Watches"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Choose an Icon</label>
            <div className="grid grid-cols-7 gap-2">
              {DEFAULT_ICONS.map((iconName) => {
                const Icon = getWardrobeIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      icon === iconName
                        ? 'bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 text-ink-900 shadow-lg shadow-wardrobe-accent-gold/20'
                        : 'bg-ink-900/60 text-ink-400 border border-ink-700/50 hover:text-ink-200 hover:border-ink-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Categories (shelves inside this wardrobe)</label>
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <div key={cat.id ?? `new-${index}`} className="flex gap-2 items-center">
                  <input
                    value={cat.label}
                    onChange={(e) => {
                      handleCategoryChange(index, e.target.value);
                      setError('');
                    }}
                    className={inputClass}
                    placeholder={`e.g. ${index === 0 ? 'Sneakers' : 'Boots'}`}
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg border border-ink-700 text-ink-400 hover:text-red-400 hover:border-red-400/40 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddCategoryField}
              className="mt-2 flex items-center gap-1.5 text-xs text-wardrobe-accent-gold hover:text-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another category
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
            >
              {isEdit ? 'Save Changes' : 'Create Wardrobe'}
            </button>
          </div>
        </form>

        {showDelete && (
          <div className="px-5 pb-5 border-t border-ink-700/60 pt-4">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-xs text-ink-400">
                  Delete <strong className="text-ink-200">{collection.name}</strong> and its{' '}
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-all"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:border-red-400/40 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Wardrobe
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
