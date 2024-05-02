import { Avatar, Breadcrumb, Button, Card, Skeleton, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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

const DetailInfo: React.FC<{
  pathname: string;
  projectId: string;
}> = (props) => {
  const { pathname, projectId } = props;
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
              // await FolderAPI.createFolder({
              //   name: formValue.projectName,
              //   url: formValue.projectUrl ?? "",
              // });
              // setRefresh();
              // info.ref?.current?.onReset();
              // closeDialog?.();
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
    setRefresh,
    updateDialogInfo,
    updateModalConfig,
  ]);

  return (
    <>
      <Breadcrumb
        style={{ margin: "16px 0" }}
        items={location.pathname
          .split("/")
          .filter(Boolean)
          .map((item) => ({
            title: item.slice(0, 1).toUpperCase() + item.slice(1),
          }))}
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
          <span>{pathname}</span>
          <Button
            type="primary"
            onClick={handleOpenDialog}
            // icon={<PlusOutlined />}
          >
            Add Rule
          </Button>
        </div>

        <div className="container">
          <Card
            style={{ width: 300, marginTop: 16 }}
            actions={[<SettingOutlined key="setting" />]}
          >
            <Skeleton loading={false} avatar active>
              <Meta title="Card title" description="This is the description" />
            </Skeleton>
          </Card>
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
