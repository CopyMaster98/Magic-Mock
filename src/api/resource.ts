import { get } from "../utils/fetch";

const getResourceInfo = (config = {}) => {
  return get("/resource/info", config);
};

export { getResourceInfo };
