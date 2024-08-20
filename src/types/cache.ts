import { IMethod } from "./index";

export type ICacheInfoRequest = {
  projectId: string;
  ruleId: string;
  cacheInfo: {
    cacheStatus: boolean;
    cacheMethodType: IMethod;
  };
};
