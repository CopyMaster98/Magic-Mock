import { Button, Card, Select, Skeleton, Switch, Tabs, Tag } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
import "./all-rule.css";
import { useCallback, useMemo, useState } from "react";
import { CacheAPI, FolderAPI, RuleAPI } from "../../../api";
import { useData } from "../../../context";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import { methodColors, methodOptions } from "../../../constant";

const AllRule: React.FC<{
  rules: any[];
  cacheData?: any[];
}> = (props) => {
  const { rules, cacheData } = props;
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh, openDialog, updateDialogInfo, closeDialog } = useData();
  const [switchLoading, setSwitchLoading] = useState(false);
  const handleNavigate = useCallback(
    (item: any, type: "mock" | "cache" = "mock") => {
      let url = `/${pathname.join("/")}/${encodeURIComponent(
        item.key
      )}${search}&ruleId=${item.id}&type=${type}`;

      if (type === "cache") url += `&methodType=${item.method}`;

      navigate(url);
    },
    [navigate, pathname, search]
  );
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

  const toggleCacheStatus = useCallback(
    async (item: any) => {
      setSwitchLoading(true);

      await CacheAPI.updateCacheInfo({
        projectId: item.parent.id,
        ruleId: item.id,
        cacheInfo: {
          cacheStatus: !item?.content?.cacheStatus,
          cacheMethodType: item?.content?.params?.request?.method,
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

  const methodTypeItems = useMemo(() => {
    const methodTypes: any = [];
    cacheData?.forEach((item) => {
      if (
        methodTypes.find(
          (method: any) => method.label === item.content.params.request.method
        )
      )
        return;
      methodTypes.push({
        key: methodTypes.length,
        label: item.content.params.request.method,
        children: (function (cacheData: any) {
          return (
            <div
              style={{
                display: "flex",
              }}
            >
              {cacheData?.map((item: any) => (
                <div
                  key={item.id}
                  className={item?.content?.cacheStatus ? "rule-card" : ""}
                  style={{
                    padding: "5px",
                    margin: "5px 5px 30px 5px",
                    borderRadius: "8px",
                    backgroundColor: "transparent",
                  }}
                >
                  <Card
                    className="card-container"
                    style={{
                      height: "100%",
                      width: 460,
                      marginLeft: 0,
                    }}
                    actions={[
                      <SettingOutlined
                        key="setting"
                        onClick={() => handleNavigate(item, "cache")}
                      />,
                    ]}
                    hoverable
                  >
                    {/* <RightClickMenu item={item} handleClick={openConfirmDialog} /> */}
                    <Skeleton loading={false} avatar active>
                      <Meta
                        title={
                          <>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flex: 1,
                                  width: 0,
                                  marginRight: "20px",
                                }}
                              >
                                <span
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {new URL(item.content.params.request.url)
                                    .pathname === "/"
                                    ? item.content.params.request.url
                                    : new URL(item.content.params.request.url)
                                        .pathname}
                                </span>
                                <Tag
                                  color={findMethod(item)?.color ?? "default"}
                                  style={{ marginLeft: "10px" }}
                                >
                                  <span>
                                    {findMethod(item)?.name ?? "null"}
                                  </span>
                                </Tag>
                                <Tag
                                  color="processing"
                                  style={{ marginLeft: "10px" }}
                                >
                                  <span>Cache</span>
                                </Tag>
                              </div>
                              <Switch
                                checkedChildren="开启"
                                unCheckedChildren="关闭"
                                loading={switchLoading}
                                defaultValue={item?.content?.cacheStatus}
                                style={{ float: "right" }}
                                onClick={() => toggleCacheStatus(item)}
                              />
                            </div>
                          </>
                        }
                        // description="This is the description"
                      />
                    </Skeleton>
                  </Card>
                </div>
              ))}
            </div>
          );
        })(
          cacheData.filter(
            (_item) =>
              _item.content.params.request.method ===
              item.content.params.request.method
          )
        ),
      });
    });

    return methodTypes;
  }, [cacheData, findMethod, handleNavigate, switchLoading, toggleCacheStatus]);

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
                  margin: "5px 5px 30px 5px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                }}
              >
                <Card
                  className="card-container"
                  style={{
                    height: "100%",
                    width: 360,
                    marginLeft: 0,
                  }}
                  actions={[
                    <SettingOutlined
                      key="setting"
                      onClick={() => handleNavigate(item)}
                    />,
                  ]}
                  hoverable
                >
                  <RightClickMenu item={item} handleClick={openConfirmDialog} />
                  <Skeleton loading={false} avatar active>
                    <Meta
                      title={
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flex: 1,
                                width: 0,
                                marginRight: "20px",
                              }}
                            >
                              <span
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.name}
                              </span>
                              <Tag
                                color="success"
                                style={{ marginLeft: "10px" }}
                              >
                                <span>Mock</span>
                              </Tag>
                            </div>
                            <Switch
                              checkedChildren="开启"
                              unCheckedChildren="关闭"
                              loading={switchLoading}
                              defaultValue={item?.content?.ruleStatus}
                              style={{ float: "right" }}
                              onClick={() => toggleRuleStatus(item)}
                            />
                          </div>
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
          <Tabs
            tabPosition={"left"}
            style={{
              flexWrap: "nowrap",
            }}
            items={methodTypeItems}
          />
        ),
      },
    ];
  }, [
    handleNavigate,
    methodTypeItems,
    openConfirmDialog,
    rules,
    switchLoading,
    toggleRuleStatus,
  ]);

  return (
    <>
      <Tabs defaultActiveKey="1" items={items} />
      {/* <div className="method-select">
        <label htmlFor="methodSelect">Method Filter: </label>
        <Select
          style={{
            minWidth: "150px",
            marginLeft: "15px",
          }}
          id="methodSelect"
          mode="multiple"
          allowClear
          placeholder="Please select"
          options={methodOptions}
        />
      </div> */}
    </>
  );
};

export default AllRule;
