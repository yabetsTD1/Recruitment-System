import api from "./api";

export const login = async ({ email, password }) => {
  const response = await api.post("/auth/login", { email, password });
  // response.data = { token, user: { id, fullName, email, department, role, active } }
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
