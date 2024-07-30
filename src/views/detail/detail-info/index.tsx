import {
  Breadcrumb,
  BreadcrumbProps,
  Button,
  Checkbox,
  Descriptions,
  Input,
  Radio,
  theme,
} from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PoweroffOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../../../context";
import { FolderAPI, ProjectAPI, RuleAPI } from "../../../api";
import "./index.css";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import RuleForm from "../../../components/rule-form";
import DetailRule from "./detail-rule";
import AllRule from "./all-rule";
import { useNavigate } from "../../../hooks/navigate";
import { scroll } from "../../../hooks";
import { multipleCreateRule } from "../../../api/rule";
import RightClickMenu from "../../../components/right-click-menu";

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
  const [checkList, setCheckList] = useState([]);
  const [isSelectStatus, setIsSelectStatus] = useState(false);
  const [doubleClickEditId, setDoubleClickEditId] = useState(null);
  const containerRef = useRef(null);
  const [isReplaceHostName, setIsReplaceHostName] = useState(0);
  const [oldReplaceHostNameValue, setOldReplaceHostNameValue] = useState("");
  const [newReplaceHostNameValue, setNewReplaceHostNameValue] = useState("");
  const [refreshNumber, setRefreshNumber] = useState(0);
  const editRulePatternInfoRef = useRef(new Map());
  const editRulePatternPrefixRef = useRef<any>(null);
  const indeterminate = false;
  const checkAll = false;

  const onCheckAllChange = useCallback((e: any) => {}, []);

  // scroll.useHorizontalScroll(containerRef, pathname.length > 1);

  const formRef = useRef<IFormRefProps>();
  const ruleFormRef = useRef<IFormRefProps>();

  const handleOpenDialog = useCallback(() => {
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: "Add Rule",
      content: <RuleForm width ref={formRef} />,
      ref: formRef,
      handleConfirm: () => {
        info.ref?.current
          ?.onValidate()
          .then(
            async (formValue: {
              ruleName: string;
              rulePattern: string;
              ruleMethod: string[];
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

              await RuleAPI.createRule({
                projectId: project.id,
                ruleName: formValue.ruleName,
                rulePattern: formValue.rulePattern,
                ruleMethod: formValue.ruleMethod,
                requestHeader: {
                  data: requestHeader,
                  type: info.ref?.current?.requestHeaderInputType
                    ? "text"
                    : "json",
                },
                responseData: {
                  data: responseData,
                  type: info.ref?.current?.responseDataInputType
                    ? "text"
                    : "json",
                },
                payload,
                responseStatusCode: formValue.responseStatusCode ?? 200,
                ruleStatus: true,
              });
              setRefresh();
              info.ref?.current?.onReset();
              closeDialog?.();
            }
          )
          .catch((err: any) => console.log(err));
      },
      handleClose: () => {
        info.ref?.current?.onReset();
      },
    };
    updateDialogInfo?.(info);
    updateModalConfig?.({
      width: "45vw",
      style: {
        minWidth: "650px",
      },
    });
    openDialog?.();
  }, [
    closeDialog,
    openDialog,
    project,
    setRefresh,
    updateDialogInfo,
    updateModalConfig,
  ]);

  const formatUrl = useCallback(
    (item: any) => {
      let str = oldReplaceHostNameValue;
      let idx = str.length;

      while (idx > 0) {
        let reg = new RegExp(str);

        if (reg.test(item.content.params.request.url))
          return item.content.params.request.url.replace(
            reg,
            newReplaceHostNameValue
          );
        str = str.slice(0, --idx);
      }

      return "";
    },
    [newReplaceHostNameValue, oldReplaceHostNameValue]
  );
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

          await RuleAPI.updateRuleInfo({
            projectId: project.id,
            ruleId: location.search.slice(1).split("&")[1].split("=")[1],
            ruleInfo: {
              ruleName: formValue.ruleName,
              rulePattern: formValue.rulePattern,
              ruleMethod: formValue.ruleMethod,
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

      const fn = status ? ProjectAPI.startProject : ProjectAPI.stopProject;

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

      setDoubleClickEditId(null);
    },
    []
  );

  const dialogInfo = useMemo(() => {
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
                  defaultValue={item.content.params.request.url}
                  onBlur={() =>
                    handleBlur({
                      id: item.id,
                      rulePattern: item.content.params.request.url,
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
                            oldReplaceHostNameValue.length > 0 &&
                            item.content.params.request.url.startsWith(
                              oldReplaceHostNameValue
                            )
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {oldReplaceHostNameValue.length > 0 &&
                        item.content.params.request.url.startsWith(
                          oldReplaceHostNameValue
                        )
                          ? oldReplaceHostNameValue
                          : item.content.params.request.url}
                      </span>

                      <div>
                        <span
                          style={{
                            display:
                              newReplaceHostNameValue.length > 0 &&
                              oldReplaceHostNameValue.length > 0 &&
                              item.content.params.request.url.startsWith(
                                oldReplaceHostNameValue
                              )
                                ? "inline-block"
                                : "none",

                            color: "#52c41a",
                          }}
                        >
                          {newReplaceHostNameValue}
                        </span>

                        <span
                          style={{
                            display:
                              oldReplaceHostNameValue.length > 0 &&
                              item.content.params.request.url.startsWith(
                                oldReplaceHostNameValue
                              )
                                ? "inline-block"
                                : "none",
                          }}
                        >
                          {item.content.params.request.url.slice(
                            oldReplaceHostNameValue.length
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
      title: "Crete & Save",
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
                setIsReplaceHostName(e.target.value);
                setOldReplaceHostNameValue("");
                setNewReplaceHostNameValue("");
              }}
              value={isReplaceHostName}
            >
              <Radio value={1}>Yes</Radio>
              <Radio value={0}>No</Radio>
            </Radio.Group>
          </div>
          {isReplaceHostName === 1 ? (
            <>
              <div>
                <label htmlFor="">Match Prefix Rule Pattern </label>
                <Input
                  value={oldReplaceHostNameValue}
                  onChange={(e) => setOldReplaceHostNameValue(e.target.value)}
                  style={{
                    marginBottom: "20px",
                  }}
                />
              </div>
              <div>
                <label htmlFor="">Replace Prefix Rule Pattern</label>
                <Input
                  value={newReplaceHostNameValue}
                  onChange={(e) => setNewReplaceHostNameValue(e.target.value)}
                  style={{
                    marginBottom: "20px",
                  }}
                />
              </div>
            </>
          ) : null}
          <Descriptions column={2} title="" bordered items={items} />
        </>
      ),
      handleConfirm: async () => {
        await multipleCreateRule({
          projectName: project._name + "@@" + encodeURIComponent(project._url),
          rulesInfo: checkList.map((item: any) => {
            console.log(
              editRulePatternInfoRef.current,
              item,
              editRulePatternInfoRef.current.get(item.id) ||
                (item.content.params.request.url.startsWith(
                  oldReplaceHostNameValue
                )
                  ? newReplaceHostNameValue +
                    item.content.params.request.url.slice(
                      oldReplaceHostNameValue.length
                    )
                  : "")
            );
            return {
              id: item.id,
              method: item.method,
              newRulePattern:
                editRulePatternInfoRef.current.get(item.id) ||
                (item.content.params.request.url.startsWith(
                  oldReplaceHostNameValue
                )
                  ? newReplaceHostNameValue +
                    item.content.params.request.url.slice(
                      oldReplaceHostNameValue.length
                    )
                  : ""),
            };
          }),
        });
        closeDialog?.();
        setRefreshNumber((oldValue) => oldValue + 1);
        setIsSelectStatus(false);
        setCheckList([]);
        setNewReplaceHostNameValue("");
        setOldReplaceHostNameValue("");
        editRulePatternInfoRef.current.clear();
        setIsReplaceHostName(0);
      },
      handleClose: () => {
        setIsReplaceHostName(0);
        setOldReplaceHostNameValue("");
        setNewReplaceHostNameValue("");
        editRulePatternInfoRef.current.clear();
      },
    };
  }, [
    checkList,
    isReplaceHostName,
    oldReplaceHostNameValue,
    newReplaceHostNameValue,
    doubleClickEditId,
    handleBlur,
    project,
    closeDialog,
  ]);

  const handleMultipleCreateSave = useCallback(async () => {
    if (isSelectStatus) {
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
    } else setIsSelectStatus((oldValue) => !oldValue);
  }, [
    dialogInfo,
    isSelectStatus,
    openDialog,
    updateDialogInfo,
    updateModalConfig,
  ]);

  useEffect(() => {
    isSelectStatus && updateDialogInfo?.(dialogInfo);
  }, [dialogInfo, isSelectStatus, updateDialogInfo]);

  const handleSaveCache = useCallback(
    async (
      formValue: {
        ruleName: string;
        rulePattern: string;
        ruleMethod: string[];
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

        await RuleAPI.createRule({
          projectId: project.id,
          ruleName: formValue.ruleName,
          rulePattern: formValue.rulePattern,
          ruleMethod: formValue.ruleMethod,
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

  const handleCreateAndSave = useCallback(async () => {
    let form: any = null;

    try {
      form = await ruleFormRef.current?.onValidate();
    } catch (error) {}

    const newFormRef = JSON.parse(JSON.stringify(ruleFormRef));
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: "Crete & Save",
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

          <div className="buttons">
            {location.search.includes("ruleId") && (
              <Button
                type="primary"
                onClick={handleBack}
                style={{
                  marginRight: "50px",
                }}
              >
                Back
              </Button>
            )}
            {currentTab === "2" && pathname.length <= 1 && (
              <>
                {/* <Checkbox
                  indeterminate={indeterminate}
                  onChange={onCheckAllChange}
                  checked={checkAll}
                >
                  Check all
                </Checkbox> */}
                <Button
                  type="primary"
                  danger
                  style={{
                    display: isSelectStatus ? "" : "none",
                    marginLeft: "30px",
                    marginRight: "30px",
                  }}
                  onClick={() => {
                    setIsSelectStatus(false);
                    setCheckList([]);
                    setRefreshNumber((oldValue) => oldValue + 1);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  style={{
                    marginLeft: "30px",
                    marginRight: "50px",
                    backgroundColor: checkList.length > 0 ? "#52c41a" : "",
                  }}
                  disabled={isSelectStatus && checkList.length === 0}
                  onClick={handleMultipleCreateSave}
                >
                  Multiple Create & Save
                </Button>
              </>
            )}
            <Button
              type="primary"
              loading={saveLoading}
              disabled={isSelectStatus}
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

            <Button
              type="primary"
              danger={project?._status ? true : false}
              style={{
                marginLeft: "50px",
              }}
              loading={loading}
              icon={<PoweroffOutlined />}
              onClick={() => handleChangeStatus(project, !project?._status)}
            >
              {project?._status ? "Stop" : "Start"}
            </Button>
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
              onCheckListChange={handleCheckListChange}
              rules={rules}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              cacheData={cacheData}
              isSelectStatus={isSelectStatus}
            />
          )}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
