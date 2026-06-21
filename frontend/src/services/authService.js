
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // أو إذا كنت تخزن بيانات أخرى:
  // localStorage.clear();
};