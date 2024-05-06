import { get, post } from "../utils/fetch";

const createRule = (data: any, config = {}) => {
  return post("/rule/create", data, config);
};

const getRuleInfo = (
  data: {
    projectId: string;
    ruleId: string;
  },
  config = {}
) => {
  const { projectId, ruleId } = data;
  return get(`/rule/info/${projectId}/${ruleId}`, config);
};

export { createRule, getRuleInfo };
