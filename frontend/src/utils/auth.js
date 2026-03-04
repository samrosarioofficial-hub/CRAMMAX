export const setToken = (token) => {
  localStorage.setItem('studymax_token', token);
};

export const getToken = () => {
  return localStorage.getItem('studymax_token');
};

export const removeToken = () => {
  localStorage.removeItem('studymax_token');
};

export const setUser = (user) => {
  localStorage.setItem('studymax_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('studymax_user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('studymax_user');
};

export const logout = () => {
  removeToken();
  removeUser();
};
