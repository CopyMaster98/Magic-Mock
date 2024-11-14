import { _delete, get, post, put } from "../utils/fetch";

const createFolder = (
  data: {
    url: string;
    name: string;
  },
  config = {}
) => {
  return post("/folder/create", data, config);
};

const getFolderInfo = (
  info?: {
    isResource: boolean;
  },
  config = {}
) => {
  const filter = info?.isResource ? "?isResource=true" : "";
  return get(`/folder/info${filter}`, config);
};

const getFolderDetail = (projectId: string, config = {}, callback: any) => {
  return get(`/folder/project/${projectId}`, config, callback);
};

const deleteFolder = (projectId: string, params = null, config = {}) => {
  return _delete(`/folder/project/${projectId}`, params, config);
};

const updateFolder = (
  data: {
    id: string;
    url: any[];
    pathname: string;
    name?: string;
  },
  config = {},
  callback?: any
) => {
  return put(`/folder/project/${data.pathname}`, data, config);
};

const addFolderUrl = (
  data: {
    id: string;
    pathname: string;
    url: string;
    newUrl: string;
  },
  config = {},
  callback?: any
) => {
  return put(`/folder/project/${data.pathname}/url`, data, config);
};

const deleteFolderUrl = (
  data: {
    id: string;
    pathname: string;
    url: string;
    deleteUrl: string;
  },
  config = {},
  callback?: any
) => {
  return _delete(`/folder/project/${data.pathname}/url`, data, config);
};

export {
  createFolder,
  getFolderInfo,
  getFolderDetail,
  updateFolder,
  deleteFolder,
  addFolderUrl,
  deleteFolderUrl,
};
