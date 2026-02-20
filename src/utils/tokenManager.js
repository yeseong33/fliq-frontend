let accessToken = null;

export const tokenManager = {
  getToken: () => accessToken,
  setToken: (token) => { accessToken = token; },
  clearToken: () => { accessToken = null; },
  getBearerToken: () => accessToken ? `Bearer ${accessToken}` : null,
};
