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

// 元字符串转分：只接受最多两位小数，避免浮点误差
export function yuanToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [yuanPart, fractionPart = ""] = normalized.split(".");
  return Number(yuanPart) * 100 + Number(fractionPart.padEnd(2, "0"));
}

// 分转元输入框字符串，例如 1990 -> "19.90"
export function centsToYuanInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
