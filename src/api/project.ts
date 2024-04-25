import { post } from "../utils/fetch"

const startProject = (data: any, config = {}) => {
  return post('/project/start', data, config)
}

const stopProject = (data: any, config = {}) => {
  return post('/project/stop', data, config)
}

export {
  startProject,
  stopProject
}