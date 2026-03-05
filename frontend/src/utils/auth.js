export const setToken = (token) => {
  localStorage.setItem('crammax_token', token);
};

export const getToken = () => {
  return localStorage.getItem('crammax_token');
};

export const removeToken = () => {
  localStorage.removeItem('crammax_token');
};

export const setUser = (user) => {
  localStorage.setItem('crammax_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('crammax_user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('crammax_user');
};

export const logout = () => {
  removeToken();
  removeUser();
};
