import { useAuth } from '../context/AuthContext';

export const isVerifiedUser = (user) =>
  Boolean(
    user?.isVerified ||
    (user?.email && user?.emailVerified) ||
    (user?.phone && user?.phoneVerified)
  );

export const useVerification = () => {
  const { user } = useAuth();
  const verified = isVerifiedUser(user);

  const requireVerification = (onBlocked) => {
    if (!verified) {
      onBlocked?.();
      return false;
    }
    return true;
  };

  return { verified, requireVerification, isVerifiedUser };
};

export default useVerification;
