import { get, post, put } from "../utils/fetch";

const createFolder = (data: any, config = {}) => {
  return post("/folder/create", data, config);
};

const getFolderInfo = (config = {}) => {
  return get("/folder/info", config);
};

const getFolderDetail = (projectId: string, config = {}, callback: any) => {
  return get(`/folder/project/${projectId}`, config, callback);
};

const updateFolder = (
  data: {
    pathname: string;
    name: string;
    url: string;
  },
  config = {},
  callback?: any
) => {
  return put(`/folder/project/${data.pathname}`, data, config);
};

export { createFolder, getFolderInfo, getFolderDetail, updateFolder };
