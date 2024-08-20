import { CacheType, IMethod } from "../types";
import { get, put } from "../utils/fetch";

const getCacheInfo = (
  data: {
    projectId: string;
    cacheId: string;
    methodType: IMethod;
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
    cacheInfo: CacheType.ICacheInfoRequest["cacheInfo"];
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
