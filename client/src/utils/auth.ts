export const getToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const removeTokens = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const getUser = (): any => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getCurrentUser = (): {
  userId: string;
  name: string;
  email: string;
} | null => {
  const user = getUser();
  if (!user) return null;

  return {
    userId: user._id || user.id,
    name: user.name,
    email: user.email,
  };
};
