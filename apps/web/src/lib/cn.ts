/**
 * className 拼接工具
 *
 * 用法:
 *   cn('base', isActive && 'active', className)
 *   → "base active" / "base"
 *
 * 简化版,只处理 falsy 值 + 字符串拼接。
 */

export function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(' ');
}
