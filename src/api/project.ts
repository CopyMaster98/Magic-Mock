import { post } from "../utils/fetch";

const startProject = (
  data: {
    name: string;
    url: string;
  },
  config = {}
) => {
  return post("/project/start", data, config);
};

const stopProject = (
  data: {
    name: string;
    url: string;
  },
  config = {}
) => {
  return post("/project/stop", data, config);
};

export { startProject, stopProject };
