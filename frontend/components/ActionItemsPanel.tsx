'use client';

import { useState } from 'react';
import type { ActionItem } from '@/lib/types';
import {
  CheckCircle2,
  Circle,
  Calendar,
  User,
  ClipboardList,
  Trash2,
  Edit,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { patchActionItem, deleteActionItem, createActionItem } from '@/lib/api';
import ToastContainer, { type ToastMessage } from '@/components/Toast';

interface Props {
  meetingId: number;
  items: ActionItem[];
}

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ActionItemsPanel({ meetingId, items: initial }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initial);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditAssignee(item.assignee || '');
    setEditDueDate(item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    setEditLoading(true);
    try {
      const updated = await patchActionItem(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        assignee: editAssignee.trim() || null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      addToast('Action item updated successfully.', 'success');
      setEditingId(null);
    } catch (err) {
      addToast('Failed to update action item.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  function addToast(message: string, type: 'success' | 'error') {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleComplete(item: ActionItem) {
    setLoadingId(item.id);
    try {
      const updated = await patchActionItem(item.id, {
        completed: !item.completed,
      });
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      addToast(
        `Action item marked as ${updated.completed ? 'completed' : 'incomplete'}.`,
        'success'
      );
    } catch (err) {
      addToast('Failed to update action item.', 'error');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this action item?')) return;
    setLoadingId(id);
    try {
      await deleteActionItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      addToast('Action item deleted successfully.', 'success');
    } catch (err) {
      addToast('Failed to delete action item.', 'error');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setAddLoading(true);
    try {
      const newItem = await createActionItem(meetingId, {
        title,
        description: description || null,
        assignee: assignee || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        completed: false,
      });
      setItems((prev) => [newItem, ...prev]);
      addToast('Action item created successfully.', 'success');
      // Reset form
      setTitle('');
      setDescription('');
      setAssignee('');
      setDueDate('');
      setIsAdding(false);
    } catch (err) {
      addToast('Failed to create action item.', 'error');
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header controls */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Action Items</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Action Item
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 animate-slide-in space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-violet-300">New Action Item</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Title *
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details or context…"
                rows={2}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Assignee Email
                </label>
                <input
                  type="email"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="assignee@company.com"
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/50 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
            >
              {addLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-600">No action items for this meeting.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const isLoading = loadingId === item.id;
            
            if (editingId === item.id) {
              return (
                <li key={item.id} className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3 animate-fade-in list-none">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        Title *
                      </label>
                      <input
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-white/8 bg-[#13151d] px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-white/8 bg-[#13151d] px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500/50 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                          Assignee Email
                        </label>
                        <input
                          type="email"
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          className="w-full rounded-lg border border-white/8 bg-[#13151d] px-3 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full rounded-lg border border-white/8 bg-[#13151d] px-3 py-1.5 text-xs text-slate-200 outline-none [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={editLoading}
                      onClick={() => handleSaveEdit(item.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
                    >
                      {editLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className={`flex gap-3 rounded-xl border p-4 transition-all group ${
                  item.completed
                    ? 'border-white/5 bg-white/3 opacity-60'
                    : 'border-white/8 bg-white/5'
                }`}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleComplete(item)}
                  disabled={isLoading}
                  className="mt-0.5 shrink-0 text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                  title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  ) : item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={`text-sm font-medium leading-snug ${
                      item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {item.title}
                  </span>

                  {item.description && (
                    <p className="text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    {item.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.assignee}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDue(item.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions container */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Edit button */}
                  <button
                    onClick={() => startEdit(item)}
                    disabled={isLoading}
                    className="text-slate-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition focus:opacity-100 disabled:opacity-50 cursor-pointer"
                    title="Edit action item"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isLoading}
                    className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition focus:opacity-100 disabled:opacity-50 cursor-pointer"
                    title="Delete action item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
