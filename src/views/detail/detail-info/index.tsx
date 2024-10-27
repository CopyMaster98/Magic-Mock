import {
  Breadcrumb,
  BreadcrumbProps,
  Button,
  Checkbox,
  Descriptions,
  Input,
  Radio,
  Select,
  theme,
} from "antd";
import { Content } from "antd/es/layout/layout";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PoweroffOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../../../context";
import "./index.css";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import RuleForm from "../../../components/rule-form";
import DetailRule from "./detail-rule";
import AllRule from "./all-rule";
import { useNavigate } from "../../../hooks/navigate";
import {
  createRule,
  multipleCreateRule,
  updateRuleInfo,
} from "../../../api/rule";
import RightClickMenu from "../../../components/right-click-menu";
import { useDebouncedState } from "../../../hooks/debounce";
import { resourceTypeOptions, statusOptions } from "../../../constant";
import Search from "antd/es/input/Search";
import { updateCacheInfo } from "../../../api/cache";
import { startProject, stopProject } from "../../../api/project";
import { clipboard } from "../../../hooks";
import { RuleAPI } from "../../../api";

const DetailInfo: React.FC<{
  pathname: any;
  project: any;
  rules: any[];
  cacheData?: any[];
}> = (props) => {
  const { pathname, project, rules, cacheData } = props;
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const {
    openDialog,
    updateDialogInfo,
    updateModalConfig,
    closeDialog,
    setRefresh,
    setSpinning,
    matchedMap,
  } = useData();

  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("1");
  const [checkList, setCheckList] = useState<any>([]);
  const [doubleClickEditId, setDoubleClickEditId] = useState(null);
  const containerRef = useRef(null);
  const [isReplaceRulePattern, setIsReplaceRulePattern] = useState(0);
  const [debouncedOldReplaceRulePattern, setDebouncedOldReplaceRulePattern] =
    useDebouncedState("");
  const [debouncedNewReplaceRulePattern, setDebouncedNewReplaceRulePattern] =
    useDebouncedState("");
  const [refreshNumber, setRefreshNumber] = useState(0);
  const editRulePatternInfoRef = useRef(new Map());
  const editRulePatternPrefixRef = useRef<any>(null);
  const formRef = useRef<IFormRefProps>();
  const ruleFormRef = useRef<IFormRefProps>();

  const [ruleStatus, setRuleStatus] = useState("All");
  const [ruleResourceType, setRuleResourceType] = useState("XHR");
  const [searchValue, setSearchValue] = useState("");
  const [isGetClipboard, setIsGetClipboard] = useState(false);

  clipboard.useGetClipboardValue(!isGetClipboard);

  const openDialogConfig = useMemo(
    () => ({
      title: "Add Rule",
      content: <RuleForm width ref={formRef} />,
      ref: formRef,
      handleConfirm: () => {
        openDialogConfig?.ref?.current
          ?.onValidate()
          .then(
            async (formValue: {
              ruleName: string;
              rulePattern: string;
              ruleMethod: string;
              resourceType: string[];
              requestHeader?: any[];
              responseData?: any[];
              requestHeaderJSON?: string;
              responseDataJSON?: string;
              payloadJSON?: string;
              responseStatusCode?: number;
            }) => {
              const requestHeader = !formRef.current?.requestHeaderInputType
                ? formValue.requestHeaderJSON &&
                  Object.keys(formValue.requestHeaderJSON).length > 0
                  ? formValue.requestHeaderJSON
                  : null
                : formValue.requestHeader ?? [];
              const responseData = !formRef.current?.responseDataInputType
                ? formValue.responseDataJSON &&
                  Object.keys(formValue.responseDataJSON).length > 0
                  ? formValue.responseDataJSON
                  : null
                : formValue.responseData ?? [];
              const payload =
                formValue.payloadJSON &&
                Object.keys(formValue.payloadJSON).length > 0
                  ? formValue.payloadJSON
                  : null;

              await createRule({
                projectId: project.id,
                ruleName: formValue.ruleName,
                rulePattern: formValue.rulePattern.trim(),
                ruleMethod: Array.isArray(formValue.ruleMethod)
                  ? formValue.ruleMethod
                  : formValue.ruleMethod === "ALL"
                  ? []
                  : [formValue.ruleMethod],
                resourceType: formValue.resourceType,
                requestHeader: {
                  data: requestHeader,
                  type: openDialogConfig?.ref?.current?.requestHeaderInputType
                    ? "text"
                    : "json",
                },
                responseData: {
                  data: responseData,
                  type: openDialogConfig?.ref?.current?.responseDataInputType
                    ? "text"
                    : "json",
                },
                payload,
                responseStatusCode: formValue.responseStatusCode ?? 200,
                ruleStatus: true,
              });
              setRefresh();
              openDialogConfig?.ref?.current?.onReset();
              closeDialog?.();
            }
          )
          .catch((err: any) => console.log(err));
      },
      handleUpdateForm: (data: any) => {
        console.log(formRef?.current?.handleInitForm);
        formRef?.current?.handleInitForm(data);
      },
      handleClose: () => {
        openDialogConfig?.ref?.current?.onReset();
        setIsGetClipboard(false);
      },
    }),
    [closeDialog, project, setRefresh]
  );
  const handleOpenDialog = useCallback(() => {
    updateDialogInfo?.(openDialogConfig);
    updateModalConfig?.({
      width: "45vw",
      style: {
        minWidth: "650px",
      },
    });
    openDialog?.();
    setIsGetClipboard(true);
  }, [openDialogConfig, openDialog, updateDialogInfo, updateModalConfig]);

  const itemRender: BreadcrumbProps["itemRender"] = (
    currentRoute,
    params,
    items,
    paths
  ) => {
    const isLast = currentRoute?.path === items[items.length - 1]?.path;

    return isLast ? (
      <span>{currentRoute.title}</span>
    ) : (
      <Link to={`/${paths.join("/")}?${(currentRoute as any).search}`}>
        {currentRoute.title}
      </Link>
    );
  };

  const mapSearch = (item: string) => {
    const searchArray = location.search?.slice(1).split("&");

    if (item.includes("project")) return searchArray[0];
    else if (item.includes("rule")) return searchArray.join("&");
    else return "";
  };

  const handleUpdateRule = useCallback(() => {
    ruleFormRef.current
      ?.onValidate()
      .then(
        async (formValue: {
          ruleName: string;
          rulePattern: string;
          ruleMethod: string[];
          resourceType: string[];
          requestHeader?: any[];
          responseData?: any[];
          requestHeaderJSON?: object;
          responseDataJSON?: object;
          payloadJSON?: string;
          responseStatusCode?: number;
        }) => {
          const requestHeader = !ruleFormRef.current?.requestHeaderInputType
            ? formValue.requestHeaderJSON &&
              Object.keys(formValue.requestHeaderJSON).length > 0
              ? formValue.requestHeaderJSON
              : null
            : formValue.requestHeader ?? [];
          const responseData = !ruleFormRef.current?.responseDataInputType
            ? formValue.responseDataJSON &&
              Object.keys(formValue.responseDataJSON).length > 0
              ? formValue.responseDataJSON
              : null
            : formValue.responseData ?? [];
          const payload =
            formValue.payloadJSON &&
            Object.keys(formValue.payloadJSON).length > 0
              ? formValue.payloadJSON
              : null;

          setSaveLoading(true);

          await updateRuleInfo({
            projectId: project.id,
            ruleId: location.search.slice(1).split("&")[1].split("=")[1],
            ruleInfo: {
              ruleName: formValue.ruleName,
              rulePattern: formValue.rulePattern.trim(),
              ruleMethod: Array.isArray(formValue.ruleMethod)
                ? formValue.ruleMethod
                : formValue.ruleMethod === "ALL"
                ? []
                : [formValue.ruleMethod],
              resourceType: formValue.resourceType,
              requestHeader: {
                data: requestHeader,
                type: ruleFormRef?.current?.requestHeaderInputType
                  ? "text"
                  : "json",
              },
              responseData: {
                data: responseData,
                type: ruleFormRef?.current?.responseDataInputType
                  ? "text"
                  : "json",
              },
              payload,
              responseStatusCode: formValue.responseStatusCode ?? 200,
            },
          });

          navigate(
            `${location.pathname.split("/").slice(0, -1).join("/")}${
              location.search.split("&")[0]
            }`
          );
        }
      )
      .catch((err: any) => console.log(err))
      .finally(() => setSaveLoading(false));
  }, [location, navigate, project]);

  const handleCheckListChange = useCallback((checkList: any) => {
    setCheckList(checkList);
  }, []);

  const handleChangeStatus = useCallback(
    async (project: any, status: boolean) => {
      setLoading(status);

      const fn = status ? startProject : stopProject;

      fn({
        name: project?._name,
        url: project?._url,
      })
        .then((res) => {
          console.log(res);
        })
        .finally(() => {
          setLoading(false);
          if (!status) {
            matchedMap?.set(`${project._name}&${project._url}`, new Map());
          }
          setRefresh();
        });
    },
    [matchedMap, setRefresh]
  );

  const handleBack = useCallback(() => {
    setTimeout(() => {
      navigate(
        `${location.pathname.split("/").slice(0, -1).join("/")}${
          location.search.split("&")[0]
        }`
      );
    });
  }, [location, navigate]);

  const handleBlur = useCallback(
    (data: { id: string; rulePattern: string }) => {
      if (editRulePatternPrefixRef.current.input.value !== data.rulePattern)
        editRulePatternInfoRef.current.set(
          data.id,
          editRulePatternPrefixRef.current.input.value
        );
      else editRulePatternInfoRef.current.delete(data.id);

      setDoubleClickEditId(null);
    },
    []
  );

  const replaceRulePatternInput = useMemo(() => {
    return (
      <>
        <div>
          <label htmlFor="">Match Prefix Rule Pattern </label>
          <Input
            // value={oldReplaceRulePattern}
            onChange={(e) => {
              setDebouncedOldReplaceRulePattern(e.target.value.trim());
            }}
            style={{
              marginBottom: "20px",
            }}
          />
        </div>
        <div>
          <label htmlFor="">Replace Prefix Rule Pattern</label>
          <Input
            // value={newReplaceRulePattern}
            onChange={(e) => {
              setDebouncedNewReplaceRulePattern(e.target.value.trim());
            }}
            style={{
              marginBottom: "20px",
            }}
          />
        </div>
      </>
    );
  }, [setDebouncedNewReplaceRulePattern, setDebouncedOldReplaceRulePattern]);

  const handleConfirmMultiple = useCallback(async () => {
    await multipleCreateRule({
      projectName: project._name + "@@" + encodeURIComponent(project._url),
      rulesInfo: checkList.map((item: any) => ({
        id: item.id,
        method: item.method,
        newRulePattern:
          editRulePatternInfoRef.current.get(item.id) ||
          (item.content.params.request.url.startsWith(
            debouncedOldReplaceRulePattern
          )
            ? debouncedNewReplaceRulePattern +
              item.content.params.request.url.slice(
                debouncedOldReplaceRulePattern.length
              )
            : ""),
      })),
    });
    closeDialog?.();
    setRefreshNumber((oldValue) => oldValue + 1);
    setCheckList([]);
    setDebouncedNewReplaceRulePattern("");
    setDebouncedOldReplaceRulePattern("");
    editRulePatternInfoRef.current.clear();
    setIsReplaceRulePattern(0);
  }, [
    checkList,
    closeDialog,
    debouncedNewReplaceRulePattern,
    debouncedOldReplaceRulePattern,
    project,
    setDebouncedNewReplaceRulePattern,
    setDebouncedOldReplaceRulePattern,
  ]);

  const dialogInfo = useMemo(() => {
    if (currentTab === "2") {
      let idx = 0;
      const items = checkList
        .map((item: any) => {
          let res = [
            {
              key: idx++,
              label: "ID",
              children: item.id,
            },
          ];
          res.push({
            key: idx++,
            label: "Rule Pattern",
            children: (
              <div
                style={{
                  position: "relative",
                }}
              >
                {doubleClickEditId === item.id ? (
                  <Input
                    ref={editRulePatternPrefixRef}
                    defaultValue={
                      editRulePatternInfoRef.current.get(item.id) ??
                      item.content.params?.request.url
                    }
                    onBlur={() =>
                      handleBlur({
                        id: item.id,
                        rulePattern: item.content.params?.request.url,
                      })
                    }
                  />
                ) : (
                  <div
                    style={{
                      maxWidth: "22vw",
                    }}
                    onDoubleClick={() => {
                      setDoubleClickEditId(item.id);
                    }}
                  >
                    <RightClickMenu
                      item={item}
                      menuButtons={
                        <Button
                          type="primary"
                          onClick={() => setDoubleClickEditId(item.id)}
                        >
                          Edit
                        </Button>
                      }
                    ></RightClickMenu>
                    {editRulePatternInfoRef.current.has(item.id) ? (
                      <span>{editRulePatternInfoRef.current.get(item.id)}</span>
                    ) : (
                      <>
                        <span
                          style={{
                            textDecoration:
                              debouncedOldReplaceRulePattern.length > 0 &&
                              item.content.params?.request.url.startsWith(
                                debouncedOldReplaceRulePattern
                              )
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {debouncedOldReplaceRulePattern.length > 0 &&
                          item.content.params?.request.url.startsWith(
                            debouncedOldReplaceRulePattern
                          )
                            ? debouncedOldReplaceRulePattern
                            : item.content.params?.request.url}
                        </span>

                        <div>
                          <span
                            style={{
                              display:
                                debouncedNewReplaceRulePattern.length > 0 &&
                                debouncedOldReplaceRulePattern.length > 0 &&
                                item.content.params?.request.url.startsWith(
                                  debouncedOldReplaceRulePattern
                                )
                                  ? "inline-block"
                                  : "none",

                              color: "#52c41a",
                            }}
                          >
                            {debouncedNewReplaceRulePattern}
                          </span>

                          <span
                            style={{
                              display:
                                debouncedOldReplaceRulePattern.length > 0 &&
                                item.content.params?.request.url.startsWith(
                                  debouncedOldReplaceRulePattern
                                )
                                  ? "inline-block"
                                  : "none",
                            }}
                          >
                            {item.content.params?.request.url.slice(
                              debouncedOldReplaceRulePattern.length
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ),
          });
          return res;
        })
        .flat(Infinity) as any;

      return {
        title: "Multiple Create & Save",
        content: (
          <>
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                Modify all rule patterns
              </label>
              <Radio.Group
                onChange={(e) => {
                  setIsReplaceRulePattern(e.target.value);
                  setDebouncedOldReplaceRulePattern("");
                  setDebouncedNewReplaceRulePattern("");
                }}
                value={isReplaceRulePattern}
              >
                <Radio value={1}>Yes</Radio>
                <Radio value={0}>No</Radio>
              </Radio.Group>
            </div>
            {isReplaceRulePattern === 1 ? replaceRulePatternInput : null}
            <Descriptions column={2} title="" bordered items={items} />
          </>
        ),
        count: checkList.length,
        handleConfirm: handleConfirmMultiple,
        handleClose: () => {
          setIsReplaceRulePattern(0);
          setDebouncedOldReplaceRulePattern("");
          setDebouncedNewReplaceRulePattern("");
          editRulePatternInfoRef.current.clear();
        },
      };
    }
  }, [
    currentTab,
    checkList,
    isReplaceRulePattern,
    replaceRulePatternInput,
    handleConfirmMultiple,
    doubleClickEditId,
    debouncedOldReplaceRulePattern,
    debouncedNewReplaceRulePattern,
    handleBlur,
    setDebouncedOldReplaceRulePattern,
    setDebouncedNewReplaceRulePattern,
  ]);

  const handleMultipleCreateSave = useCallback(async () => {
    updateDialogInfo?.(dialogInfo);
    updateModalConfig?.({
      width: "45vw",
      style: {
        minWidth: "650px",
      },
      className: "multiple-create-dialog",
      styles: {
        body: {
          overflowY: "hidden",
          padding: "20px 30px",
          scrollbarWidth: "none",
        },
      },
    });
    openDialog?.();
  }, [dialogInfo, openDialog, updateDialogInfo, updateModalConfig]);

  const openConfirmDialog = useCallback(
    (item: any) => {
      const info: IDialogInfo<IFormRefProps | undefined> = {
        title: "确认删除",
        handleConfirm: async () => {
          await Promise.allSettled(
            item.map((_item: any) =>
              RuleAPI.deleteRule({
                ruleId: _item.id,
                projectId: _item.parent?.id,
              })
            )
          );

          closeDialog?.();
          setCheckList([]);
          setRefresh();
        },
      };

      updateDialogInfo?.(info);
      openDialog?.();
    },
    [closeDialog, openDialog, setRefresh, updateDialogInfo]
  );

  const handleMultipleChange = useCallback(async () => {
    if (currentTab === "1") {
      await Promise.allSettled(
        checkList.map(async (rule: any) => {
          await updateRuleInfo({
            ruleId: rule.id,
            projectId: rule.parent.id,
            ruleInfo: {
              ruleStatus: !rule?.content?.ruleStatus,
            },
          });
        })
      );
    } else if (currentTab === "2") {
      await Promise.allSettled(
        checkList.map(async (rule: any) => {
          await updateCacheInfo({
            ruleId: rule.id,
            projectId: rule.parent.id,
            cacheInfo: {
              cacheStatus: !rule?.content?.cacheStatus,
              cacheMethodType: rule?.content?.params?.request?.method,
            },
          });
        })
      );
    }

    setCheckList([]);
    setRefreshNumber((oldValue) => oldValue + 1);
  }, [checkList, currentTab]);

  const cardStatusSelectOptions = useMemo(
    () => [
      {
        label: "All",
        value: "All",
      },
      ...statusOptions,
    ],
    []
  );

  const resourceTypeSelectOptions = useMemo(() => {
    const data = currentTab === "1" ? rules : cacheData;

    return [
      {
        label: "All",
        value: "All",
      },
      ...resourceTypeOptions.filter((option) =>
        data?.find(
          (item) =>
            (
              item.content.resourceType ?? item.content.params?.resourceType
            )?.includes(option.value) || !item.content.resourceType?.length
        )
      ),
    ];
  }, [cacheData, currentTab, rules]);

  const handleCardStatusSelectChange = useCallback(
    (value: any, type?: string, data?: any[]) => {
      const updateData = (
        data ? data : (type === "1" ? rules : cacheData) || []
      ).filter(
        (item) =>
          (
            item.content.rulePattern ?? item.content.params?.request.url
          )?.includes(searchValue) || item.name.includes(searchValue)
      );
      switch (value) {
        case "All":
          return updateData;
        case "Start":
          return updateData?.filter(
            (item) => item.content.ruleStatus ?? item.content.cacheStatus
          );
        case "Stop":
          return updateData?.filter(
            (item) => !(item.content.ruleStatus ?? item.content.cacheStatus)
          );
        default:
          return updateData;
      }
    },
    [cacheData, rules, searchValue]
  );

  const handleCardResourceTypeChange = useCallback(
    (value: any, type?: string, data?: any[]) => {
      const updateData = data ? data : (type === "1" ? rules : cacheData) || [];
      switch (value) {
        case "All":
          return updateData;
        default:
          return updateData?.filter((item) => {
            const resourceType =
              item.content.resourceType ?? item.content.params?.resourceType;

            return (
              (Array.isArray(resourceType) && resourceType.length === 0) ||
              resourceType?.includes(value) ||
              resourceType?.includes("All")
            );
          });
      }
    },
    [cacheData, rules]
  );

  const ruleCard = useMemo(
    () =>
      handleCardResourceTypeChange(
        ruleResourceType,
        "",
        handleCardStatusSelectChange(ruleStatus, "1")
      ),
    [
      handleCardResourceTypeChange,
      handleCardStatusSelectChange,
      ruleResourceType,
      ruleStatus,
    ]
  );

  const cacheCard = useMemo(
    () =>
      handleCardResourceTypeChange(
        ruleResourceType,
        "",
        handleCardStatusSelectChange(ruleStatus, "2")
      ),
    [
      handleCardResourceTypeChange,
      handleCardStatusSelectChange,
      ruleResourceType,
      ruleStatus,
    ]
  );

  useEffect(() => {
    updateDialogInfo?.(dialogInfo);
  }, [dialogInfo, updateDialogInfo]);

  const handleSaveCache = useCallback(
    async (
      formValue: {
        ruleName: string;
        rulePattern: string;
        ruleMethod: string[];
        resourceType: string[];
        requestHeader?: any[];
        responseData?: any[];
        requestHeaderJSON?: object;
        responseDataJSON?: object;
        payloadJSON?: string;
        responseStatusCode?: number;
      } | null,
      ruleFormRef: any
    ) => {
      if (formValue) {
        const requestHeader = !ruleFormRef.current?.requestHeaderInputType
          ? formValue.requestHeaderJSON &&
            Object.keys(formValue.requestHeaderJSON).length > 0
            ? formValue.requestHeaderJSON
            : null
          : formValue.requestHeader ?? [];
        const responseData = !ruleFormRef.current?.responseDataInputType
          ? formValue.responseDataJSON &&
            Object.keys(formValue.responseDataJSON).length > 0
            ? formValue.responseDataJSON
            : null
          : formValue.responseData ?? [];
        const payload =
          formValue.payloadJSON && Object.keys(formValue.payloadJSON).length > 0
            ? formValue.payloadJSON
            : null;

        setSaveLoading(true);

        await createRule({
          projectId: project.id,
          ruleName: formValue.ruleName,
          rulePattern: formValue.rulePattern.trim(),
          ruleMethod: Array.isArray(formValue.ruleMethod)
            ? formValue.ruleMethod
            : formValue.ruleMethod === "ALL"
            ? []
            : [formValue.ruleMethod],
          resourceType: formValue.resourceType,
          requestHeader: {
            data: requestHeader,
            type: ruleFormRef?.current?.requestHeaderInputType
              ? "text"
              : "json",
          },
          responseData: {
            data: responseData,
            type: ruleFormRef?.current?.responseDataInputType ? "text" : "json",
          },
          payload,
          responseStatusCode: formValue.responseStatusCode ?? 200,
          ruleStatus: true,
        });

        navigate(
          `${location.pathname.split("/").slice(0, -1).join("/")}${
            location.search.split("&")[0]
          }`
        );
      }
      setSaveLoading(false);
      closeDialog?.();
    },
    [closeDialog, location, navigate, project]
  );

  const [defaultSearchValue, setDefaultSearchValue] = useState("");

  useEffect(() => {
    if (searchValue === defaultSearchValue) return;

    setDefaultSearchValue(searchValue);
  }, [defaultSearchValue, searchValue]);

  const handleSearch = useCallback((e: any) => {
    setSearchValue(e);
  }, []);

  const handleCreateAndSave = useCallback(async () => {
    let form: any = null;

    try {
      form = await ruleFormRef.current?.onValidate();
    } catch (error) {}

    const newFormRef = JSON.parse(JSON.stringify(ruleFormRef));
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: "Create & Save",
      content: <div>Cache Data will create file and save as mock data.</div>,
      handleConfirm: () => handleSaveCache(form, newFormRef),
    };
    updateDialogInfo?.(info);
    updateModalConfig?.({
      width: "45vw",
      style: {
        minWidth: "650px",
      },
    });
    openDialog?.();
  }, [handleSaveCache, openDialog, updateDialogInfo, updateModalConfig]);

  useEffect(() => {
    setRefreshNumber((oldValue) => oldValue + 1);
  }, [ruleStatus]);

  return (
    <>
      <Breadcrumb
        style={{ margin: "16px 0" }}
        items={location.pathname
          .split("/")
          .filter(Boolean)
          .map((item) => ({
            title: item.slice(0, 1).toUpperCase() + item.slice(1),
            path: item,
            search: mapSearch(item),
          }))}
        itemRender={itemRender}
        separator=">"
      />
      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 24,
          margin: 0,
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        <div className="sub-title">
          <span>
            {decodeURIComponent(
              pathname[pathname.length - 1].slice(0, 1).toUpperCase() +
                pathname[pathname.length - 1].slice(1)
            )}
          </span>

          <div className="filter-container">
            {pathname.length <= 1 && (
              <div className="filters">
                <div className="filter">
                  <label
                    htmlFor="status"
                    style={{
                      marginRight: "10px",
                    }}
                  >
                    Search
                  </label>
                  <Search
                    style={{
                      maxWidth: "300px",
                      minWidth: "150px",
                    }}
                    placeholder="Search url pattern"
                    defaultValue={defaultSearchValue}
                    onSearch={handleSearch}
                    onChange={(e) => {
                      if (!e.target.value.length && searchValue.length) {
                        setDefaultSearchValue("");
                        handleSearch("");
                      }
                    }}
                    enterButton
                  />
                </div>
                <div className="filter">
                  <label
                    htmlFor="status"
                    style={{
                      marginRight: "10px",
                    }}
                  >
                    Status
                  </label>
                  <Select
                    id="status"
                    style={{
                      width: "150px",
                    }}
                    // disabled={!!checkList.length}
                    // showSearch
                    value={ruleStatus}
                    placeholder="Select Status"
                    optionFilterProp="label"
                    onChange={setRuleStatus}
                    options={cardStatusSelectOptions}
                  />
                </div>
                <div className="filter">
                  <label
                    htmlFor="resourceType"
                    style={{
                      marginRight: "10px",
                    }}
                  >
                    Resource Type
                  </label>
                  <Select
                    id="resourceType"
                    style={{
                      width: "150px",
                    }}
                    // disabled={!!checkList.length}
                    // showSearch
                    value={ruleResourceType}
                    placeholder="Select Status"
                    optionFilterProp="label"
                    onChange={setRuleResourceType}
                    options={resourceTypeSelectOptions}
                  />
                </div>
              </div>
            )}

            <div
              className="buttons"
              style={{
                display: "flex",
                flexWrap: "wrap",
                flex: 1,
                justifyContent: "flex-end",
                gap: "15px 30px",
              }}
            >
              {location.search.includes("ruleId") && (
                <Button type="primary" onClick={handleBack}>
                  Back
                </Button>
              )}
              {pathname.length <= 1 && (
                <>
                  <Button
                    type="primary"
                    danger
                    style={{
                      display:
                        currentTab === "1" && checkList.length !== 0
                          ? "inline-block"
                          : "none",
                    }}
                    onClick={() => openConfirmDialog(checkList)}
                  >
                    Delete
                  </Button>
                  <Button
                    type="primary"
                    style={{
                      display:
                        currentTab === "2" && project && checkList.length !== 0
                          ? "inline-block"
                          : "none",

                      backgroundColor: checkList.length > 0 ? "#52c41a" : "",
                    }}
                    onClick={handleMultipleCreateSave}
                  >
                    Multiple Select
                  </Button>
                </>
              )}
              <Button
                type="primary"
                loading={saveLoading}
                disabled={!project}
                onClick={
                  location.search.includes("ruleId")
                    ? location.search.includes("type=cache")
                      ? handleCreateAndSave
                      : handleUpdateRule
                    : handleOpenDialog
                }
              >
                {location.search.includes("ruleId")
                  ? location.search.includes("type=cache")
                    ? "Create & Save"
                    : "Save"
                  : "Add Rule"}
              </Button>

              {!location.search.includes("ruleId") && (
                <Button
                  type="primary"
                  danger={project?._status ? true : false}
                  loading={loading}
                  disabled={!project}
                  icon={<PoweroffOutlined />}
                  onClick={() => handleChangeStatus(project, !project?._status)}
                >
                  {project?._status ? "Stop" : "Start"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div
          className="container"
          ref={containerRef}
          style={
            pathname.length > 1
              ? {
                  flex: 1,
                }
              : {}
          }
        >
          {pathname.length > 1 ? (
            <DetailRule ref={ruleFormRef} />
          ) : (
            <AllRule
              key={refreshNumber}
              onChangeCheckList={handleCheckListChange}
              // onChangeCardStatus={handleCardStatusChange}
              rules={ruleCard}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              cacheData={cacheCard}
            />
          )}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
