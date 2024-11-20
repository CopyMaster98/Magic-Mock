import { forwardRef, useCallback, useEffect, useState } from "react";
import RuleForm from "../../../components/rule-form";
import "./resource-rule.css";
import { useLocation } from "react-router-dom";
import { CacheAPI, RuleAPI, ResourceAPI } from "../../../api";
import { methods } from "../../../constant";

const DetailRule: React.FC<any> = forwardRef((props, ref) => {
  const location = useLocation();
  const [ruleForm, setRuleForm] = useState(null);

  const getRuleInfo = useCallback(async (projectId: string, ruleId: string) => {
    const res = await ResourceAPI.getResourceInfo({
      projectId,
      ruleId,
    });

    const formValue = res.data;

    if (formValue?.requestHeaderType === "text") {
      formValue.requestHeader = (formValue.requestHeader || [])
        .map((item: any) => {
          const keys = Object.keys(item);

          return keys.map((key) => ({
            key: key,
            value: item[key],
          }));
        })
        .flat(Infinity);
    }

    if (formValue?.responseDataType === "text") {
      formValue.responseData = (formValue.responseData || [])
        .map((item: any) => {
          const keys = Object.keys(item);

          return keys.map((key) => ({
            key: key,
            value: item[key],
          }));
        })
        .flat(Infinity);
    }

    if (!formValue.ruleMethod.length) formValue.ruleMethod = ["ALL"];

    setRuleForm(formValue);
  }, []);

  const getCacheInfo = useCallback(
    async (
      projectId: string,
      cacheId: string,
      methodType: (typeof methods)[number]
    ) => {
      const res = await CacheAPI.getCacheInfo({
        projectId,
        cacheId,
        methodType,
      });

      setRuleForm(res.data);
    },
    []
  );

  useEffect(() => {
    const [projectInfo, ruleInfo, typeInfo, methodTypeInfo] = location.search
      .slice(1)
      .split("&");
    const projectId = projectInfo.split("=")[1];
    const ruleId = ruleInfo.split("=")[1];
    const type = typeInfo?.split("=")[1] as any;
    const methodType = methodTypeInfo?.split("=")[1] as any;

    if (type === "mock") getRuleInfo(projectId, ruleId);
    else getCacheInfo(projectId, ruleId, methodType);
  }, [getCacheInfo, getRuleInfo, location]);

  return (
    <div className="detail-rule-container">
      <RuleForm data={ruleForm} ref={ref} isUpdate={true}></RuleForm>
    </div>
  );
});

export default DetailRule;
