import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  isOrderStatus,
} from "@/lib/constants";

export function OrderStatusBadge({ status }: { status: string }) {
  if (!isOrderStatus(status)) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_CLASSES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
