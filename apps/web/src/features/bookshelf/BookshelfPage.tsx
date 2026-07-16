/**
 * Bookshelf Page - 书架视图
 *
 * 整体壳:Welcome Banner + 搜索 + 书卡网格
 */

import { Book, Plus, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useBooksStore, useNewBookStore, useWorkspaceStore } from '../../stores';
import { Button, EmptyState } from '../../components';
import { BookCard } from './BookCard';

export function BookshelfPage() {
  const books = useBooksStore((s) => s.books);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useWorkspaceStore((s) => s.setSearchQuery);
  const setActiveBook = useWorkspaceStore((s) => s.setActiveBook);
  const deleteBook = useBooksStore((s) => s.deleteBook);
  const openNewBook = useNewBookStore((s) => s.open);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.brief.toLowerCase().includes(q),
    );
  }, [books, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto custom-scroll bg-[#FAF9F6] p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl border border-[#F0EBE3] p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_24px_rgba(120,142,118,0.03)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0F2EF] rounded-full filter blur-3xl -z-10 translate-x-20 -translate-y-20 opacity-60" />
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#FAF5EC] text-[#BC9F77] px-2.5 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 spark-glow" />
              <span>多智能体协同，赋予文字灵魂</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4A5A48] font-serif">林间静谧的灵感书房</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Arcadia AI 拥有革命性的"一书一独立知识库"设计。通过多位具有独特职责的 AI 智能体（规划、创作、质量评审）在后台协同推进章节创作，并允许人类导演随时以"断点干预"甚至"从此处重写"的方式完全掌控小说主线。
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={openNewBook}
            className="wood-button w-full md:w-auto px-6 py-3.5 rounded-xl font-bold shadow-[0_8px_20px_rgba(212,185,150,0.3)] hover:translate-y-[-1px]"
            icon={<Plus className="w-5 h-5" />}
          >
            新建协同书籍
          </Button>
        </div>

        {/* Search + Grid Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#4A5A48]">我的虚拟书阁</h3>
            <p className="text-xs text-gray-400">管理您拥有的专属小说知识库与创作进度</p>
          </div>
          <input
            type="text"
            placeholder="搜索书名、流派或大纲..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 text-xs px-3.5 py-2 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#788E76] transition-colors"
          />
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => setActiveBook(book.id)}
              onDelete={(e) => {
                e.stopPropagation();
                if (window.confirm('你确定要彻底删除这本书及它的所有知识库与章节设定吗？此操作无法撤销。')) {
                  deleteBook(book.id);
                  if (useWorkspaceStore.getState().activeBookId === book.id) {
                    useWorkspaceStore.getState().setActiveBook(null);
                  }
                }
              }}
            />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Book className="w-12 h-12" />}
                title="未找到任何书籍项目"
                action={
                  <Button onClick={openNewBook} icon={<Plus className="w-3.5 h-3.5" />}>
                    新建我的第一本书
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
