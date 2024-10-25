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
  Table,
} from "antd";
import Meta from "antd/es/card/Meta";
import {
  DeleteOutlined,
  FrownOutlined,
  PoweroffOutlined,
  SettingOutlined,
  SmileOutlined,
} from "@ant-design/icons";
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

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [checkList, setCheckList] = useState<any>([]);
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const { setRefresh, openDialog, updateDialogInfo, closeDialog, matchedMap } =
    useData();
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    const res: any[] = [];

    selectedRowKeys.forEach((rowKey) => {
      const data = rules.find((rule) => rule.key === rowKey);
      if (data) res.push(data);
    });
    onChangeCheckList?.(res);
  }, [selectedRowKeys, onChangeCheckList, rules]);

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
        projectId: item.parent?.id,
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
            projectId: item.parent?.id,
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

  const findMethod = useCallback(
    (data: any, type: "mock" | "cache" = "mock") => {
      if (type === "cache")
        return methodColors.find(
          (item) => item.name === data?.content?.params?.request?.method
        );

      return data?.length > 0 && data?.length < 7
        ? (data || []).map((item: any) =>
            methodColors.find((_item) => _item.name === item)
          )
        : [methodColors.find((_item) => _item.name === "ALL")];
    },
    []
  );

  const findResource = useCallback(
    (data: any, type: "mock" | "cache" = "mock") => {
      if (type === "cache")
        return resourceTypeColors.find(
          (item) => item.name === data?.content?.params?.resourceType
        );

      return data?.length > 0 && data?.length < 11
        ? (data || []).map((item: any) =>
            resourceTypeColors.find((_item) => _item.name === item)
          )
        : [resourceTypeColors.find((_item) => _item.name === "All")];
    },
    []
  );

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

  // const methodTypeItems = useMemo(() => {
  //   const methodTypes: any = [
  //     {
  //       key: 0,
  //       label: "All",
  //       children: (function (cacheData: any) {
  //         return (
  //           <div
  //             style={{
  //               display: "flex",
  //             }}
  //           >
  //             {isSelectStatus ? (
  //               <CheckboxGroup
  //                 style={{
  //                   justifyContent: "space-around",
  //                 }}
  //                 options={getCacheDataCards(cacheData)}
  //                 value={checkList}
  //                 onChange={setCheckList}
  //               />
  //             ) : (
  //               getCacheDataCards(cacheData)
  //             )}
  //           </div>
  //         );
  //       })(cacheData),
  //     },
  //   ];
  //   cacheData?.forEach((item) => {
  //     if (
  //       methodTypes.find(
  //         (method: any) => method.label === item.content.params?.request.method
  //       )
  //     )
  //       return;

  //     methodTypes.push({
  //       key: methodTypes.length,
  //       label: item.content.params?.request.method,
  //       children: (function (cacheData: any) {
  //         return (
  //           <div
  //             style={{
  //               display: "flex",
  //             }}
  //           >
  //             {isSelectStatus ? (
  //               <CheckboxGroup
  //                 style={{
  //                   justifyContent: "space-around",
  //                 }}
  //                 options={getCacheDataCards(cacheData)}
  //                 value={checkList}
  //                 onChange={setCheckList}
  //               />
  //             ) : (
  //               getCacheDataCards(cacheData)
  //             )}
  //           </div>
  //         );
  //       })(
  //         cacheData.filter(
  //           (_item) =>
  //             _item.content.params?.request.method ===
  //             item.content.params?.request.method
  //         )
  //       ),
  //     });
  //   });

  //   return methodTypes;
  // }, [cacheData, checkList, getCacheDataCards, isSelectStatus, setCheckList]);

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

  const [dotStatus, setDotStatus] = useState<any>({});

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const columns: any = useMemo(
    () => [
      {
        title: "Rule Name",
        dataIndex: "name",
        key: "name",
        className: "break-word width-400",
      },
      {
        title: "Rule Pattern",
        dataIndex: "pattern",
        key: "pattern",
        className: "break-word width-800",
      },
      {
        title: "Status",
        align: "center",
        key: "status",
        render: (item: any) => (
          <Tag
            color={item.status ? "success" : "default"}
            style={{ marginLeft: "10px" }}
          >
            <span>{item.status ? "Running" : "Stop"}</span>
          </Tag>
        ),
      },

      {
        title: "Method Type",
        align: "center",
        dataIndex: "methodType",
        key: "methodType",
        render: (item: any) => {
          const methods = findMethod(item);

          return (
            <>
              {methods?.map((method: any, index: number) => (
                <Tag
                  key={index}
                  color={method?.color ?? "default"}
                  style={{ marginLeft: "10px" }}
                >
                  <span>{method?.name ?? "null"}</span>
                </Tag>
              ))}
            </>
          );
        },
      },

      {
        title: "Resource Type",
        align: "center",
        dataIndex: "resourceType",
        key: "resourceType",
        width: 600,
        render: (item: any) => {
          const resource = findResource(item);

          return (
            <>
              {resource?.map((resource: any, index: number) => (
                <Tag
                  key={index}
                  color={resource?.color ?? "default"}
                  style={{ margin: "5px" }}
                >
                  <span>{resource?.name ?? "null"}</span>
                </Tag>
              ))}
            </>
          );
        },
      },
      {
        title: "Matched Count",
        align: "center",
        key: "matchedCount",
        width: 100,
        fixed: "right",
        defaultSortOrder: "ascend",
        sorter: (a: any, b: any) => {
          const [aNum, bNum] = [a, b].map(
            (item) =>
              matchedMap
                ?.get(`${item.parent.name}&${item.parent.url}`)
                ?.get("mock")
                ?.get(item.content.id) || 0
          );

          return bNum - aNum;
        },
        render: (item: any) => {
          const matchedNum =
            matchedMap
              ?.get(`${item.parent.name}&${item.parent.url}`)
              ?.get("mock")
              ?.get(item.content.id) || 0;

          if (matchedNum !== dotStatus[item.content.id]?.num)
            setDotStatus({
              ...dotStatus,
              [item.content.id]: {
                isRead: false,
                num: matchedNum,
              },
            });

          return matchedNum > 0 ? (
            <Badge dot={!dotStatus[item.content.id]?.isRead}>
              <Tag
                className="matched-item"
                icon={item.status ? <SmileOutlined /> : <FrownOutlined />}
                color={item.status ? "success" : "warning"}
                style={{
                  margin: 0,
                  cursor: "pointer",
                }}
                onMouseEnter={() =>
                  setDotStatus({
                    ...dotStatus,
                    [item.content.id]: {
                      ...dotStatus[item.content.id],
                      isRead: true,
                    },
                  })
                }
              >
                <span>{matchedNum}</span>
              </Tag>
            </Badge>
          ) : (
            <span style={{ color: "rgba(0, 0, 0, 0.5)" }}>No Matched</span>
          );
        },
      },
      {
        title: "Action",
        align: "center",
        key: "action",
        fixed: "right",
        width: 300,
        render: (item: any) => {
          let itemStatus =
            item.type === "cache" ? item?.content?.cacheStatus : item.status;
          return (
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <Button
                danger={itemStatus ? true : false}
                type="primary"
                icon={<PoweroffOutlined />}
                loading={switchLoading}
                onClick={(e) => {
                  console.log(item);
                  e.stopPropagation();
                  if (item.type === "cache") toggleCacheStatus(item);
                  else toggleRuleStatus(item);
                }}
              >
                {itemStatus ? "Stop" : "Start"}
              </Button>
              <Button
                color="default"
                icon={<SettingOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate(item);
                }}
              >
                Setting
              </Button>

              {item.type !== "cache" && (
                <Button
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirmDialog(item);
                  }}
                ></Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      dotStatus,
      findMethod,
      findResource,
      handleNavigate,
      matchedMap,
      openConfirmDialog,
      switchLoading,
      toggleCacheStatus,
      toggleRuleStatus,
    ]
  );

  const getCacheDataCards = useCallback(
    (cacheData: any) => {
      const data = (cacheData || []).map((item: any, index: number) => ({
        name: item.content?.ruleName,
        pattern: item.content?.params?.request?.url,
        methodType: item.content?.ruleMethod,
        resourceType: item.content?.resourceType,
        status: item.content?.ruleStatus,
        ...item,
      }));

      const rowClassName = (record: any) => {
        const matchedNum =
          matchedMap
            ?.get(`${record.parent.name}&${record.parent.url}`)
            ?.get("mock")
            ?.get(record.content.id) || 0;

        return matchedNum > 0 ? "success-border" : "";
      };

      return (
        <Table
          scroll={{ x: "max-content" }}
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectChange,
          }}
          sticky
          columns={columns}
          dataSource={data}
          pagination={false}
          rowClassName={rowClassName}
        />
      );
    },
    [selectedRowKeys, columns, matchedMap]
  );

  const getMockDataCards = useCallback(
    (mockData: any) => {
      const data = (mockData || []).map((item: any, index: number) => ({
        name: item.content?.ruleName,
        pattern: item.content?.rulePattern,
        methodType: item.content?.ruleMethod,
        resourceType: item.content?.resourceType,
        status: item.content?.ruleStatus,
        ...item,
      }));

      const rowClassName = (record: any) => {
        const matchedNum =
          matchedMap
            ?.get(`${record.parent.name}&${record.parent.url}`)
            ?.get("mock")
            ?.get(record.content.id) || 0;

        return matchedNum > 0 ? "success-border" : "";
      };

      return (
        <Table
          scroll={{ x: "max-content" }}
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectChange,
          }}
          sticky
          columns={columns}
          dataSource={data}
          pagination={false}
          rowClassName={rowClassName}
        />
      );
    },
    [columns, matchedMap, selectedRowKeys]
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
          <div>{rules.length > 0 ? getMockDataCards(rules) : <Empty />}</div>
        ),
      },
      {
        key: "2",
        label: "Cache",
        children: (
          <div>
            {rules.length > 0 ? getCacheDataCards(cacheData) : <Empty />}
          </div>
        ),
      },
    ];
  }, [cacheData, getCacheDataCards, getMockDataCards, rules]);

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
