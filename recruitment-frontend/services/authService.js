import api from "./api";

// Local login (email + password against our own DB)
export const login = async ({ email, password }) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

// Keycloak login — exchange a Keycloak access_token for our user profile
export const keycloakLogin = async (keycloakToken) => {
  const response = await api.post(
    "/auth/keycloak",
    {},
    { headers: { Authorization: `Bearer ${keycloakToken}` } }
  );
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
