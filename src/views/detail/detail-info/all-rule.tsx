import { Card, Skeleton, Switch, Tag } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
import "./all-rule.css";
import { useCallback, useState } from "react";
import { FolderAPI, RuleAPI } from "../../../api";
import { useData } from "../../../context";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
const AllRule: React.FC<{
  rules: any[];
}> = (props) => {
  const { rules } = props;
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh, openDialog, updateDialogInfo, closeDialog } = useData();
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
          ruleStatus: !rule?.content?.ruleStatus,
        },
      });
      setSwitchLoading(false);
      setRefresh();
      closeDialog?.();
    },
    [closeDialog, setRefresh]
  );

  const openConfirmDialog = useCallback(
    (item: any) => {
      const info: IDialogInfo<IFormRefProps | undefined> = {
        title: "确认删除",
        handleConfirm: async () => {
          await RuleAPI.deleteRule({
            ruleId: item.id,
            projectId: item.parent.id,
          });

          closeDialog?.();
          setRefresh();
        },
      };

      updateDialogInfo?.(info);
      openDialog?.();
    },
    [closeDialog, openDialog, setRefresh, updateDialogInfo]
  );

  return (
    <>
      {rules.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "5px",
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
            <RightClickMenu item={item} handleClick={openConfirmDialog} />
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
