import { get, put } from "../utils/fetch";

const getResourceInfo = (config = {}) => {
  return get("/resource/info", config);
};

const updateResourceInfo = (
  data: {
    projectId: string;
    status: boolean;
  },
  config = {},
  callback?: any
) => {
  const { projectId, status } = data;
  return put(
    `/resource/info/${data.projectId}`,
    {
      status,
    },
    config
  );
};

export { getResourceInfo, updateResourceInfo };
