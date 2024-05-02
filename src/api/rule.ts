import { post } from "../utils/fetch";

const createRule = (data: any, config = {}) => {
  return post("/rule/create", data, config);
};

export { createRule };
