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
  const containerRef = useRef(null);
  const [isReplaceHostName, setIsReplaceHostName] = useState(0);
  const [newReplaceHostNameValue, setNewReplaceHostNameValue] = useState("");
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
              <div
                style={{
                  maxWidth: "22vw",
                }}
              >
                <span
                  style={{
                    textDecoration:
                      newReplaceHostNameValue.length > 0
                        ? "line-through"
                        : "none",
                  }}
                >
                  {newReplaceHostNameValue.length > 0
                    ? new URL(item.content.params.request.url).origin
                    : item.content.params.request.url}
                </span>

                <div>
                  <span
                    style={{
                      display:
                        newReplaceHostNameValue.length > 0
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
                        newReplaceHostNameValue.length > 0
                          ? "inline-block"
                          : "none",
                    }}
                  >
                    {new URL(item.content.params.request.url).pathname}
                  </span>
                </div>
              </div>

              {/* <Button
                style={{
                  position: "absolute",
                  right: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                Edit
              </Button> */}
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
                setNewReplaceHostNameValue("");
              }}
              value={isReplaceHostName}
            >
              <Radio value={1}>Yes</Radio>
              <Radio value={0}>No</Radio>
            </Radio.Group>
          </div>
          {isReplaceHostName === 1 ? (
            <Input
              value={newReplaceHostNameValue}
              onChange={(e) => setNewReplaceHostNameValue(e.target.value)}
              style={{
                marginBottom: "20px",
              }}
            />
          ) : null}
          <Descriptions column={2} title="" bordered items={items} />
        </>
      ),
      handleConfirm: async () => {
        await multipleCreateRule({
          projectName: project._name + "@@" + encodeURIComponent(project._url),
          rulesInfo: checkList.map((item: any) => ({
            id: item.id,
            method: item.method,
          })),
          newRulePatternPrefix: newReplaceHostNameValue,
        });
        closeDialog?.();
        setIsSelectStatus(false);
        setCheckList([]);
        setNewReplaceHostNameValue("");
        setIsReplaceHostName(0);
      },
      handleClose: () => {
        setIsReplaceHostName(0);
        setNewReplaceHostNameValue("");
      },
    };
  }, [
    checkList,
    isReplaceHostName,
    newReplaceHostNameValue,
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
              rules={rules}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              cacheData={cacheData}
              checkList={checkList}
              setCheckList={setCheckList}
              isSelectStatus={isSelectStatus}
            />
          )}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
