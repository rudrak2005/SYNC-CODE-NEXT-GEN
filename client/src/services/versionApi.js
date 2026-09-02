import api from "./api";

export const fetchVersions = async (
  roomId
) => {

  const res =
    await api.get(`/version/${roomId}`);

  return res.data;
};

export const createSnapshot = async (
  roomId,
  author
) => {

  const res =
    await api.post(
      `/version/${roomId}/snapshot`,
      { author }
    );

  return res.data;
};

export const restoreSnapshot = async (
  roomId,
  revision
) => {

  const res =
    await api.post(
      `/version/${roomId}/restore`,
      { revision }
    );

  return res.data;
};