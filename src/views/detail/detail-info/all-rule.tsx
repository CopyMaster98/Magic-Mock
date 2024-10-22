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
  Empty,
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
import { methodColors, resourceTypeColors } from "../../../constant";
import { updateRuleInfo } from "../../../api/rule";

const CheckboxGroup = Checkbox.Group;

const AllRule: React.FC<{
  rules: any[];
  setCurrentTab: any;
  isSelectStatus: boolean;
  currentTab: string;
  onChangeCheckList: any;
  handleUpdateSelectStatus: any;
  cacheData?: any[];
}> = (props) => {
  const {
    rules,
    cacheData,
    setCurrentTab,
    isSelectStatus,
    currentTab,
    onChangeCheckList,
    handleUpdateSelectStatus,
  } = props;

  const [checkList, setCheckList] = useState<any>([]);
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh, openDialog, updateDialogInfo, closeDialog, matchedMap } =
    useData();
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    onChangeCheckList?.(checkList);
  }, [checkList, onChangeCheckList]);

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

      await updateRuleInfo({
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
      if (!item) {
        setCheckList([]);
        return;
      }
      const newCheckList = (cacheData || [])
        ?.filter(
          (_item) =>
            _item.content.params?.request.method ===
            item.content.params?.request.method
        )
        .filter(
          (item) => !checkList.find((_item: any) => _item.id === item.id)
        );

      currentTab === "1"
        ? setCheckList(rules)
        : setCheckList([...checkList, ...newCheckList]);
    },
    [cacheData, checkList, currentTab, rules]
  );

  const findMethod = useCallback((method: any) => {
    return methodColors.find(
      (item) => item.name === method.content.params.request.method
    );
  }, []);

  const findResource = useCallback((data: any) => {
    return resourceTypeColors.find(
      (item) => item.name === data.content.params?.resourceType
    );
  }, []);

  const isSelectedCard = useCallback(
    (cardInfo: any) =>
      checkList.find(
        (item: any) => item.id + item.method === cardInfo.id + cardInfo.method
      ),
    [checkList]
  );

  const cacheDataCardsSwitch = useCallback(
    (data: any) => {
      return (
        <Switch
          key={data.id + data?.content?.cacheStatus}
          checkedChildren="开启"
          unCheckedChildren="关闭"
          loading={switchLoading}
          defaultValue={data?.content?.cacheStatus}
          style={{ float: "right" }}
          onClick={() => toggleCacheStatus(data)}
        />
      );
    },
    [switchLoading, toggleCacheStatus]
  );

  const getCacheDataCards = useCallback(
    (cacheData: any) => {
      return (cacheData || [])?.map((item: any, index: number) => {
        const matchedNum =
          matchedMap
            ?.get(`${item.parent.name}&${item.parent.url}`)
            ?.get(item.type)
            ?.get(item.content.id) || 0;
        let html = (
          <div
            key={item.id + item.method}
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
                {isSelectStatus ? (
                  <RightClickMenu
                    item={item}
                    menuButtons={
                      <Button
                        type="primary"
                        onClick={() => handleAllSelected(item)}
                      >
                        All Select
                      </Button>
                    }
                    style={{
                      zIndex: 999,
                    }}
                    // handleClick={() => handleAllSelected(item)}
                  />
                ) : (
                  <RightClickMenu
                    item={item}
                    menuButtons={
                      <>
                        <Button
                          type="primary"
                          onClick={() => {
                            if (!isSelectStatus) handleUpdateSelectStatus(true);

                            setCheckList((oldValue: any) => [
                              ...oldValue.filter(
                                (_item: any) => _item.id !== item.id
                              ),
                              item,
                            ]);
                          }}
                        >
                          Select
                        </Button>
                      </>
                    }
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
                              color={findResource(item)?.color ?? "default"}
                              style={{ marginLeft: "10px" }}
                            >
                              <span>{findResource(item)?.name ?? "null"}</span>
                            </Tag>
                            <Tag
                              color="processing"
                              style={{ marginLeft: "10px" }}
                            >
                              <span>Cache</span>
                            </Tag>
                          </div>
                          {cacheDataCardsSwitch(item)}
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
      matchedMap,
      isSelectedCard,
      isSelectStatus,
      findMethod,
      findResource,
      cacheDataCardsSwitch,
      handleNavigate,
      handleAllSelected,
      handleUpdateSelectStatus,
    ]
  );

  const methodTypeItems = useMemo(() => {
    const methodTypes: any = [
      {
        key: 0,
        label: "All",
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
                  options={getCacheDataCards(cacheData)}
                  value={checkList}
                  onChange={setCheckList}
                />
              ) : (
                getCacheDataCards(cacheData)
              )}
            </div>
          );
        })(cacheData),
      },
    ];
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
                  options={getCacheDataCards(cacheData)}
                  value={checkList}
                  onChange={setCheckList}
                />
              ) : (
                getCacheDataCards(cacheData)
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

    console.log(methodTypes);
    return methodTypes;
  }, [cacheData, checkList, getCacheDataCards, isSelectStatus, setCheckList]);

  const mockDataCardsSwitch = useCallback(
    (data: any) => {
      return (
        <Switch
          key={data.id + data?.content?.ruleStatus}
          checkedChildren="开启"
          unCheckedChildren="关闭"
          loading={switchLoading}
          defaultValue={data?.content?.ruleStatus}
          style={{ float: "right" }}
          onClick={() => toggleRuleStatus(data)}
        />
      );
    },
    [switchLoading, toggleRuleStatus]
  );

  const getMockDataCards = useCallback(
    (mockData: any) => {
      return (mockData || [])?.map((data: any, index: number) => {
        const matchedNum =
          matchedMap
            ?.get(`${data.parent.name}&${data.parent.url}`)
            ?.get(data.type ?? "mock")
            ?.get(data.content.id) || 0;

        const html = (
          <div
            key={data.id}
            className={data?.content?.ruleStatus ? "rule-card" : ""}
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
                  isSelectedCard(data)
                    ? "card-selected card-container"
                    : isSelectStatus
                    ? "card-container card-select"
                    : "card-container"
                }
                style={{
                  height: "100%",
                  width: 360,
                  marginLeft: 0,
                }}
                actions={[
                  <SettingOutlined
                    key="setting"
                    onClick={() => handleNavigate(data)}
                  />,
                ]}
                hoverable
              >
                {isSelectStatus ? (
                  <RightClickMenu
                    item={data}
                    menuButtons={
                      <Button
                        type="primary"
                        onClick={() => handleAllSelected(data)}
                      >
                        All Select
                      </Button>
                    }
                    style={{
                      zIndex: 999,
                    }}
                    // handleClick={}
                  />
                ) : (
                  <RightClickMenu
                    item={data}
                    menuButtons={
                      <Button
                        danger={true}
                        type="primary"
                        onClick={openConfirmDialog}
                      >
                        Delete
                      </Button>
                    }
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
                              {decodeURIComponent(data.name).split("ηhash")[0]}
                            </span>
                            <Tag color="success" style={{ marginLeft: "10px" }}>
                              <span>Mock</span>
                            </Tag>
                          </div>
                          {mockDataCardsSwitch(data)}
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

        data[Symbol.toStringTag] = data.id;

        if (isSelectStatus)
          return {
            label: html,
            value: data,
          };

        return html;
      });
    },

    [
      handleAllSelected,
      handleNavigate,
      isSelectStatus,
      isSelectedCard,
      matchedMap,
      mockDataCardsSwitch,
      openConfirmDialog,
    ]
  );

  const handleChangeTab = useCallback(
    (e: any) => {
      setCheckList([]);
      setTimeout(() => setCurrentTab(e));
    },
    [setCurrentTab]
  );
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
            {rules.length > 0 ? (
              isSelectStatus ? (
                <CheckboxGroup
                  style={{
                    justifyContent: "space-around",
                  }}
                  options={getMockDataCards(rules)}
                  value={checkList}
                  onChange={setCheckList}
                />
              ) : (
                getMockDataCards(rules)
              )
            ) : (
              <Empty />
            )}
          </div>
        ),
      },
      {
        key: "2",
        label: "Cache",
        children: (
          <>
            {cacheData && cacheData?.length > 0 ? (
              <Tabs
                tabPosition={"left"}
                style={{
                  flexWrap: "nowrap",
                }}
                onChange={() => handleAllSelected(null)}
                items={methodTypeItems}
              />
            ) : (
              <Empty />
            )}
          </>
        ),
      },
    ];
  }, [
    cacheData,
    checkList,
    getMockDataCards,
    handleAllSelected,
    isSelectStatus,
    methodTypeItems,
    rules,
  ]);

  return (
    <>
      <Tabs
        defaultActiveKey={currentTab}
        items={items}
        onChange={handleChangeTab}
      />
    </>
  );
};

export default AllRule;
