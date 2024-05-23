import { forwardRef, useEffect, useState } from "react";
import RuleForm from "../../../components/rule-form";
import "./detail-rule.css";
import { useLocation } from "react-router-dom";
import { get } from "../../../utils/fetch";
import { RuleAPI } from "../../../api";

const DetailRule: React.FC<any> = forwardRef((props, ref) => {
  const location = useLocation();
  const [ruleForm, setRuleForm] = useState(null);

  useEffect(() => {
    const [projectInfo, ruleInfo] = location.search.slice(1).split("&");
    const projectId = projectInfo.split("=")[1];
    const ruleId = ruleInfo.split("=")[1];

    RuleAPI.getRuleInfo({
      projectId,
      ruleId,
    }).then((res) => {
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
    });
  }, [location]);

  return (
    <div className="detail-rule-container">
      <RuleForm data={ruleForm} ref={ref}></RuleForm>
    </div>
  );
});

export default DetailRule;
