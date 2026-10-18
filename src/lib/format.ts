// 分转人民币字符串，例如 1990 -> "¥19.90"
export function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

// 统一的中文日期格式；固定时区避免服务端与浏览器时区不同导致 hydration 不一致
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

export function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
}
