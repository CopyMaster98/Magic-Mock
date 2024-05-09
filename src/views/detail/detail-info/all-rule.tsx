import { Card, Skeleton, Switch, Tag } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
import "./all-rule.css";
import { useCallback, useState } from "react";
import { RuleAPI } from "../../../api";
import { useData } from "../../../context";
const AllRule: React.FC<{
  rules: any[];
}> = (props) => {
  const { rules } = props;
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh } = useData();
  const [switchLoading, setSwitchLoading] = useState(false);
  const handleNavigate = (item: any) => {
    navigate(`/${pathname.join("/")}/${item.key}${search}&ruleId=${item.id}`);
  };
  const toggleRuleStatus = useCallback(
    async (rule: any) => {
      setSwitchLoading(true);

      await RuleAPI.updateRuleInfo({
        ruleId: rule.id,
        projectId: rule.parent.id,
        ruleInfo: {
          ruleStatus: rule?.content?.ruleStatus,
        },
      });
      setSwitchLoading(false);
      setRefresh();
    },
    [setRefresh]
  );

  return (
    <>
      {rules.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "10px",
            margin: "30px 30px 30px 0",
            borderRadius: "8px",
            backgroundColor: "transparent",
            ...(item?.content?.ruleStatus
              ? {
                  backgroundImage:
                    "linear-gradient(var(--direc), #5ddcff, #3c67e3 43%, #4e00c2)",
                  animation: "rotate 3s linear infinite",
                }
              : {}),
          }}
        >
          <Card
            className="card-container"
            style={{
              width: 300,
              marginLeft: 0,
            }}
            actions={[
              <SettingOutlined
                key="setting"
                onClick={() => handleNavigate(item)}
              />,
            ]}
          >
            <RightClickMenu item={item} />
            <Skeleton loading={false} avatar active>
              <Meta
                title={
                  <>
                    <span>{item.name}</span>
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                      loading={switchLoading}
                      defaultValue={item?.content?.ruleStatus}
                      style={{ float: "right" }}
                      onClick={() => toggleRuleStatus(item)}
                    />
                  </>
                }
                // description="This is the description"
              />
            </Skeleton>
          </Card>
        </div>
      ))}
    </>
  );
};

export default AllRule;
