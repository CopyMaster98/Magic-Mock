import { forwardRef, useEffect, useState } from "react";
import RuleForm from "../../../components/rule-form";
import "./detail-rule.css";
import { useLocation } from "react-router-dom";
import { get } from "../../../utils/fetch";
import { RuleAPI } from "../../../api";

const DetailRule: React.FC<any> = forwardRef((props, ref) => {
  const location = useLocation();
  const [ruleForm, setRuleForm] = useState({});

  useEffect(() => {
    const [projectInfo, ruleInfo] = location.search.slice(1).split("&");
    const projectId = projectInfo.split("=")[1];
    const ruleId = ruleInfo.split("=")[1];

    RuleAPI.getRuleInfo({
      projectId,
      ruleId,
    }).then((res) => {
      const formValue = res.data;

      if (formValue.requestHeaderType === "text") {
        formValue.requestHeader = (formValue.requestHeader || [])
          .map((item: any) => {
            const keys = Object.keys(item);

            return keys.map((key) => ({
              headerKey: key,
              newHeaderValue: item[key],
            }));
          })
          .flat(Infinity);
      } else {
        formValue.requestHeaderJSON = formValue.requestHeaderJSON
          ? JSON.stringify(formValue.requestHeaderJSON)
          : formValue.requestHeaderJSON;
      }

      if (formValue.responseDataType === "text") {
        formValue.responseData = (formValue.responseData || [])
          .map((item: any) => {
            const keys = Object.keys(item);

            return keys.map((key) => ({
              dataKey: key,
              newDataValue: item[key],
            }));
          })
          .flat(Infinity);
      } else {
        formValue.responseDataJSON = formValue.responseDataJSON
          ? JSON.stringify(formValue.responseDataJSON)
          : formValue.responseDataJSON;
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
