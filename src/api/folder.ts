import { get, post } from "../utils/fetch"

const createFolder = (data: any, config = {}) => {
  return post('/folder/create', data, config)
}

const getFolderInfo = (config = {}) => {
  return get('/folder/info', config)
}

const getFolderDetail = (pathname: string, config = {}, callback: any) => {
  return get(`/folder/project/${pathname}`, config, callback)
}


export {
  createFolder,
  getFolderInfo,
  getFolderDetail
}