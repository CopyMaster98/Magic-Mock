import {
  Card,
  Skeleton,
  Switch,
  Tabs,
  Tag,
  Checkbox,
  Badge,
  Menu,
  Button,
} from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
import "./all-rule.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CacheAPI, RuleAPI } from "../../../api";
import { useData } from "../../../context";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import { methodColors } from "../../../constant";

const CheckboxGroup = Checkbox.Group;

const AllRule: React.FC<{
  rules: any[];
  setCurrentTab: any;
  isSelectStatus: boolean;
  currentTab: string;
  onCheckListChange: any;
  cacheData?: any[];
}> = (props) => {
  const {
    rules,
    cacheData,
    setCurrentTab,
    isSelectStatus,
    currentTab,
    onCheckListChange,
  } = props;

  const [checkList, setCheckList] = useState<any>([]);
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh, openDialog, updateDialogInfo, closeDialog, matchedMap } =
    useData();
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    onCheckListChange?.(checkList);
  }, [checkList, onCheckListChange]);

  const handleNavigate = useCallback(
    (item: any, type: "mock" | "cache" = "mock") => {
      let url = `/${pathname.join("/")}/${item.key}${search}&ruleId=${
        item.id
      }&type=${type}`;

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

  const handleAllSelected = useCallback(
    (item: any | null) => {
      setCheckList(
        item
          ? cacheData?.filter(
              (_item) =>
                _item.content.params?.request.method ===
                item.content.params?.request.method
            )
          : []
      );
    },
    [cacheData, setCheckList]
  );

  const findMethod = useCallback((method: any) => {
    return methodColors.find(
      (item) => item.name === method.content.params.request.method
    );
  }, []);

  const isSelectedCard = useCallback(
    (cardInfo: any) => {
      return checkList.find((item: any) => item.id === cardInfo.id);
    },
    [checkList]
  );

  const getCards = useCallback(
    (cacheData: any) => {
      return (cacheData || [])?.map((item: any, index: number) => {
        const matchedNum =
          matchedMap
            ?.get(`${item.parent.name}&${item.parent.url}`)
            ?.get(item.type)
            ?.get(item.content.id) || 0;
        let html = (
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
            <Badge count={matchedNum}>
              <Card
                className={
                  isSelectedCard(item)
                    ? "card-selected card-container"
                    : isSelectStatus
                    ? "card-container card-select"
                    : "card-container"
                }
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
                {isSelectStatus && (
                  <RightClickMenu
                    item={item}
                    menuButtons={<Button type="primary">All Select</Button>}
                    style={{
                      zIndex: 999,
                    }}
                    handleClick={() => handleAllSelected(item)}
                  />
                )}

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
                              <span>{findMethod(item)?.name ?? "null"}</span>
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
            </Badge>
          </div>
        );

        item[Symbol.toStringTag] = item.id;

        if (isSelectStatus)
          return {
            label: html,
            value: item,
          };

        return html;
      });
    },
    [
      findMethod,
      handleAllSelected,
      handleNavigate,
      isSelectStatus,
      isSelectedCard,
      matchedMap,
      switchLoading,
      toggleCacheStatus,
    ]
  );

  const methodTypeItems = useMemo(() => {
    const methodTypes: any = [];
    cacheData?.forEach((item) => {
      if (
        methodTypes.find(
          (method: any) => method.label === item.content.params?.request.method
        )
      )
        return;

      methodTypes.push({
        key: methodTypes.length,
        label: item.content.params?.request.method,
        children: (function (cacheData: any) {
          return (
            <div
              style={{
                display: "flex",
              }}
            >
              {isSelectStatus ? (
                <CheckboxGroup
                  style={{
                    justifyContent: "space-around",
                  }}
                  options={getCards(cacheData)}
                  value={checkList}
                  onChange={setCheckList}
                />
              ) : (
                getCards(cacheData)
              )}
            </div>
          );
        })(
          cacheData.filter(
            (_item) =>
              _item.content.params?.request.method ===
              item.content.params?.request.method
          )
        ),
      });
    });

    return methodTypes;
  }, [cacheData, checkList, getCards, isSelectStatus, setCheckList]);

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
            {rules.map((item) => {
              const matchedNum =
                matchedMap
                  ?.get(`${item.parent.name}&${item.parent.url}`)
                  ?.get(item.type ?? "mock")
                  ?.get(item.content.id) || 0;
              return (
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
                  <Badge count={matchedNum}>
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
                      <RightClickMenu
                        item={item}
                        handleClick={openConfirmDialog}
                      />
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
                                    {decodeURIComponent(item.name)}
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
                  </Badge>
                </div>
              );
            })}
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
            onChange={() => handleAllSelected(null)}
            items={methodTypeItems}
          />
        ),
      },
    ];
  }, [
    handleAllSelected,
    handleNavigate,
    matchedMap,
    methodTypeItems,
    openConfirmDialog,
    rules,
    switchLoading,
    toggleRuleStatus,
  ]);

  return (
    <>
      <Tabs
        defaultActiveKey={currentTab}
        items={items}
        onChange={setCurrentTab}
      />
    </>
  );
};

export default AllRule;
