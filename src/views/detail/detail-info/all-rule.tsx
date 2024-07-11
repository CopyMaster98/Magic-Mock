import { Card, Skeleton, Switch, Tabs, Tag } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
import "./all-rule.css";
import { useCallback, useMemo, useState } from "react";
import { FolderAPI, RuleAPI } from "../../../api";
import { useData } from "../../../context";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import { methodColors } from "../../../constant";

const AllRule: React.FC<{
  rules: any[];
  cacheData?: any[];
}> = (props) => {
  const { rules, cacheData } = props;
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

  const findMethod = useCallback((method: any) => {
    return methodColors.find(
      (item) => item.name === method.content.params.request.method
    );
  }, []);

  const items = useMemo(() => {
    return [
      {
        key: "1",
        label: "Mock",
        children: (
          <div
            style={{
              display: "flex",
            }}
          >
            {rules.map((item) => (
              <div
                key={item.id}
                className={item?.content?.ruleStatus ? "rule-card" : ""}
                style={{
                  padding: "5px",
                  margin: "0 30px 30px 5px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  // ...(item?.content?.ruleStatus
                  //   ? {
                  //       background:
                  //         "repeating-conic-gradient(from var(--dir), #0f0, #ff0, #0ff, #f0f,#0ff)",
                  //       // backgroundImage:
                  //       //   "linear-gradient(var(--dir), #eaff8f, #52c41a 43%, #5cdbd3)",
                  //       animation: "rotate 4s linear infinite",
                  //     }
                  //   : {}),
                }}
              >
                <Card
                  className="card-container"
                  style={{
                    minWidth: 300,
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
                          <Tag
                            color={
                              item.type === "cache" ? "processing" : "success"
                            }
                            style={{ marginLeft: "10px" }}
                          >
                            <span>
                              {item.type === "cache" ? "Cache" : "Mock"}
                            </span>
                          </Tag>
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
          </div>
        ),
      },
      {
        key: "2",
        label: "Cache",
        children: (
          <div
            style={{
              display: "flex",
            }}
          >
            {cacheData?.map((item) => (
              <div
                key={item.id}
                className={item?.content?.ruleStatus ? "rule-card" : ""}
                style={{
                  padding: "5px",
                  margin: "0 30px 30px 5px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  // ...(item?.content?.ruleStatus
                  //   ? {
                  //       backgroundImage:
                  //         "linear-gradient(var(--dir), #5ddcff, #3c67e3 43%, #4e00c2)",
                  //       animation: "rotate 4s linear infinite",
                  //     }
                  //   : {}),
                }}
              >
                <Card
                  className="card-container"
                  style={{
                    minWidth: 300,
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
                          <span>
                            {new URL(item.content.params.request.url).pathname}
                          </span>
                          <Tag
                            color={findMethod(item)?.color ?? "default"}
                            style={{ marginLeft: "10px" }}
                          >
                            <span>{findMethod(item)?.name ?? "null"}</span>
                          </Tag>
                          <Tag
                            color={
                              item.type === "cache" ? "processing" : "success"
                            }
                            style={{ marginLeft: "10px" }}
                          >
                            <span>
                              {item.type === "cache" ? "Cache" : "Mock"}
                            </span>
                          </Tag>
                          <Switch
                            checkedChildren="开启"
                            unCheckedChildren="关闭"
                            loading={switchLoading}
                            defaultValue={item?.content?.ruleStatus}
                            style={{ float: "right" }}
                            // onClick={() => toggleRuleStatus(item)}
                          />
                        </>
                      }
                      // description="This is the description"
                    />
                  </Skeleton>
                </Card>
              </div>
            ))}
          </div>
        ),
      },
    ];
  }, [
    cacheData,
    findMethod,
    handleNavigate,
    openConfirmDialog,
    rules,
    switchLoading,
    toggleRuleStatus,
  ]);

  return (
    <>
      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
};

export default AllRule;
