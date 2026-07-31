import { orderStatusGroupMeta } from '../../utils/orderStatus';

export default function OrderStatusBadge({ status, className = '' }) {
  const meta = orderStatusGroupMeta(status);

  return (
    <span className={`order-status-badge ${meta.className} ${className}`.trim()}>
      {meta.label}
    </span>
  );
}
