import { get, put } from "../utils/fetch";

const getCacheInfo = (
  data: {
    projectId: string;
    cacheId: string;
    methodType: any;
  },
  config = {}
) => {
  const { projectId, cacheId, methodType } = data;

  return get(
    `/cache/info/${projectId}/${cacheId}?methodType=${methodType}`,
    config
  );
};

const updateCacheInfo = (
  data: {
    projectId: string;
    ruleId: string;
    cacheInfo: any;
  },
  config = {}
) => {
  const { projectId, ruleId, cacheInfo } = data;

  return put(
    `/cache/info/${projectId}/${ruleId}`,
    {
      cacheInfo,
    },
    config
  );
};

export { getCacheInfo, updateCacheInfo };
