import { useEffect, useState } from "react";
import RuleForm from "../../../components/rule-form";
import "./detail-rule.css";
import { useLocation } from "react-router-dom";
import { get } from "../../../utils/fetch";
import { RuleAPI } from "../../../api";

const DetailRule: React.FC = () => {
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

      formValue.requestHeader = formValue.requestHeader
        .map((item: any) => {
          const keys = Object.keys(item);

          return keys.map((key) => ({
            headerKey: key,
            newHeaderValue: item[key],
          }));
        })
        .flat(Infinity);

      formValue.responseData = formValue.responseData
        .map((item: any) => {
          const keys = Object.keys(item);

          return keys.map((key) => ({
            dataKey: key,
            newDataValue: item[key],
          }));
        })
        .flat(Infinity);

      setRuleForm(formValue);
    });
  }, [location]);

  return (
    <div className="detail-rule-container">
      <RuleForm data={ruleForm}> </RuleForm>
    </div>
  );
};

export default DetailRule;
