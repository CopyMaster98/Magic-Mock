import {
  Avatar,
  Breadcrumb,
  BreadcrumbProps,
  Button,
  Card,
  Skeleton,
  theme,
} from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SettingOutlined,
  EllipsisOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { get } from "../../../utils/fetch";
import { useData } from "../../../context";
import { FolderAPI, RuleAPI } from "../../../api";
import "./index.css";
import Meta from "antd/es/card/Meta";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import AddProjectForm from "../../../components/add-project-form";
import AddRuleForm from "../../../components/add-rule-form";
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
    projectInfo,
  } = useData();

  const location = useLocation();

  useEffect(() => {
    projectId &&
      FolderAPI.getFolderDetail(projectId, {}, setSpinning).then((res) => {
        console.log(res);
      });
  }, [pathname, projectId, setSpinning]);

  const formRef = useRef<IFormRefProps>();
  const handleOpenDialog = useCallback(() => {
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: "Add Rule",
      content: <AddRuleForm width ref={formRef} />,
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
              console.log(formValue, projectId);
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
      width: "40vw",
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
            onClick={handleOpenDialog}
            // icon={<PlusOutlined />}
          >
            Add Rule
          </Button>
        </div>

        <div className="container">
          {pathname.length > 1 ? <DetailRule /> : <AllRule rules={rules} />}
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
