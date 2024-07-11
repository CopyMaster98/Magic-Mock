import { Breadcrumb, BreadcrumbProps, Button, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useRef, useState } from "react";
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
  } = useData();

  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // useEffect(() => {
  //   projectId &&
  //     !location.search.includes("ruleId") &&
  //     FolderAPI.getFolderDetail(projectId, {}, setSpinning).then((res) => {
  //       console.log(res);
  //     });
  // }, [location, pathname, projectId, setSpinning]);

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
          console.log(formValue);
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
              responseStatusCode: formValue.responseStatusCode ?? null,
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
        name: project._name,
        url: project._url,
      })
        .then((res) => {
          console.log(res);
        })
        .finally(() => {
          setLoading(false);
          setRefresh();
        });
    },
    [setRefresh]
  );

  const handleBack = useCallback(() => {
    setTimeout(() => {
      navigate(
        `${location.pathname.split("/").slice(0, -1).join("/")}${
          location.search.split("&")[0]
        }`
      );
    });
  }, []);
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
            {pathname[pathname.length - 1].slice(0, 1).toUpperCase() +
              pathname[pathname.length - 1].slice(1)}
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
            <Button
              type="primary"
              loading={saveLoading}
              onClick={
                location.search.includes("ruleId")
                  ? handleUpdateRule
                  : handleOpenDialog
              }
            >
              {location.search.includes("ruleId") ? "Save" : "Add Rule"}
            </Button>

            <Button
              type="primary"
              danger={project?._status ? true : false}
              style={{
                marginLeft: "50px",
              }}
              loading={loading}
              icon={<PoweroffOutlined />}
              onClick={(e) => handleChangeStatus(project, !project?._status)}
            >
              {project?._status ? "Stop" : "Start"}
            </Button>
          </div>
        </div>

        <div
          className="container"
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
            <AllRule rules={rules} cacheData={cacheData} />
          )}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
