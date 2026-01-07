import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const DashboardNotes: React.FC = () => {
    const [notes, setNotes] = useState<{ id: string; content: string; is_completed: boolean }[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        const { data } = await supabase
            .from('dashboard_notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setNotes(data);
    };

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;

        const { data } = await supabase
            .from('dashboard_notes')
            .insert([{ content: newNoteContent }])
            .select()
            .single();

        if (data) {
            setNotes([data, ...notes]);
            setNewNoteContent('');
        }
    };

    const handleToggleNote = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('dashboard_notes')
            .update({ is_completed: !currentStatus })
            .eq('id', id);

        if (!error) {
            setNotes(notes.map(n => n.id === id ? { ...n, is_completed: !currentStatus } : n));
        }
    };

    const handleDeleteNote = async (id: string) => {
        const { error } = await supabase
            .from('dashboard_notes')
            .delete()
            .eq('id', id);

        if (!error) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Minhas Anotações</h3>
            </div>
            <div className="rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Adicionar nova anotação..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleAddNote}
                        className="h-10 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Adicionar
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                    {notes.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">Nenhuma anotação ainda.</p>
                    ) : (
                        notes.map((note) => (
                            <div
                                key={note.id}
                                onDoubleClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                                className={`group flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer select-none`}
                                title="Clique duas vezes para expandir/colapsar"
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleNote(note.id, note.is_completed);
                                        }}
                                        className={`shrink-0 size-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${note.is_completed
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-primary text-transparent'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    </button>
                                    <span className={`text-sm transition-all duration-200 ${note.is_completed
                                        ? 'text-slate-400 line-through decoration-slate-400'
                                        : 'text-slate-700 dark:text-slate-300'
                                        } ${expandedNoteId === note.id ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                                        {note.content}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNote(note.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all self-start"
                                    title="Excluir"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardNotes;
