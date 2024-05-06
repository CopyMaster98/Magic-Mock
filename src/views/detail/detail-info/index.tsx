import { Breadcrumb, BreadcrumbProps, Button, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../../../context";
import { FolderAPI, RuleAPI } from "../../../api";
import "./index.css";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import RuleForm from "../../../components/rule-form";
import DetailRule from "./detail-rule";
import AllRule from "./all-rule";

const DetailInfo: React.FC<{
  pathname: any;
  projectId: string;
  rules: any[];
}> = (props) => {
  const { pathname, projectId, rules } = props;
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

  useEffect(() => {
    projectId &&
      !location.search.includes("ruleId") &&
      FolderAPI.getFolderDetail(projectId, {}, setSpinning).then((res) => {
        console.log(res);
      });
  }, [location, pathname, projectId, setSpinning]);

  const formRef = useRef<IFormRefProps>();
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
              requestHeader?: any[];
              responseData?: any[];
            }) => {
              await RuleAPI.createRule({
                projectId,
                ruleName: formValue.ruleName,
                rulePattern: formValue.rulePattern,
                requestHeader:
                  !formValue.requestHeader ||
                  formValue.requestHeader.length === 0
                    ? []
                    : formValue.requestHeader,
                responseData:
                  !formValue.responseData || formValue.responseData.length === 0
                    ? []
                    : formValue.responseData,
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
    });
    openDialog?.();
  }, [
    closeDialog,
    openDialog,
    projectId,
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
          <Button
            type="primary"
            onClick={
              location.search.includes("ruleId") ? () => {} : handleOpenDialog
            }
          >
            {location.search.includes("ruleId") ? "Save" : "Add Rule"}
          </Button>
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
          {pathname.length > 1 ? <DetailRule /> : <AllRule rules={rules} />}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
