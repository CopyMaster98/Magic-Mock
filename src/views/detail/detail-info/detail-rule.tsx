import { forwardRef, useCallback, useEffect, useState } from "react";
import RuleForm from "../../../components/rule-form";
import "./detail-rule.css";
import { useLocation } from "react-router-dom";
import { CacheAPI, RuleAPI } from "../../../api";
import { methods } from "../../../constant";

const DetailRule: React.FC<any> = forwardRef((props, ref) => {
  const location = useLocation();
  const [ruleForm, setRuleForm] = useState(null);

  const getRuleInfo = useCallback(async (projectId: string, ruleId: string) => {
    const res = await RuleAPI.getRuleInfo({
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

      console.log(res);
    },
    []
  );

  useEffect(() => {
    const [projectInfo, ruleInfo, typeInfo, methodTypeInfo] = location.search
      .slice(1)
      .split("&");
    const projectId = projectInfo.split("=")[1];
    const ruleId = ruleInfo.split("=")[1];
    const type = typeInfo.split("=")[1] as any;
    const methodType = methodTypeInfo.split("=")[1] as any;

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
