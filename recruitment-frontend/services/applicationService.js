import api from "./api";

export const applyJob = async (data) => {
  const res = await api.post("/applications/apply", data);
  return res.data;
};