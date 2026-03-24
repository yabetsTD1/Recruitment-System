import api from "./api";

export const getRecruitments = async () => {
  const res = await api.get("/recruitments");
  return res.data;
};

export const createRecruitment = async (data) => {
  const res = await api.post("/recruitments", data);
  return res.data;
};