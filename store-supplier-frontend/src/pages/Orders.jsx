import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../utils/safeStorage';

/** Orders management moved to the dashboard home page. */
export default function Orders() {
  const user = getStoredUser({});
  const baseRoute = user?.role === 'supplier' ? '/supplier' : '/store';
  return <Navigate to={baseRoute} replace />;
}
