import { Button, Card, Tag, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PoweroffOutlined,
  EditOutlined,
  UnorderedListOutlined,
  ChromeOutlined,
} from "@ant-design/icons";
import { useData } from "../../../context";
import { FolderAPI, ProjectAPI } from "../../../api";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import AddProjectForm from "../../../components/project-form";
import { useNavigate } from "../../../hooks/navigate";
import RightClickMenu from "../../../components/right-click-menu";

const HomeDetail: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const { openDialog, updateDialogInfo, refresh, setRefresh, closeDialog } =
    useData();
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState<any>({});
  const formRef = useRef<IFormRefProps>();

  const handleChangeStatus = useCallback(
    async (project: any, status: boolean) => {
      setLoading((oldValue: any) => ({
        ...oldValue,
        [project.id]: status,
      }));

      const fn = status ? ProjectAPI.startProject : ProjectAPI.stopProject;

      fn({
        name: project.name,
        url: project.url,
      })
        .then((res) => {
          console.log(res);
        })
        .finally(() => {
          setLoading((oldValue: any) => ({
            ...oldValue,
            [project.id]: false,
          }));
          setRefresh();
        });
    },
    [setRefresh]
  );

  const handleEditDialogConfirm = useCallback(
    (
      data: {
        name: string;
        url: string;
        id: string;
      },
      info: IDialogInfo<IFormRefProps | undefined>
    ) =>
      info.ref?.current
        ?.onValidate()
        .then(
          async (formValue: { projectName: string; projectUrl: string }) => {
            if (
              formValue.projectName !== data.name ||
              formValue.projectUrl !== data.url
            ) {
              await FolderAPI.updateFolder({
                pathname: data.name,
                name: formValue.projectName,
                url: formValue.projectUrl,
                id: data.id,
              });
              setRefresh();
            }
            info.ref?.current?.onReset();
            closeDialog?.();
          }
        )
        .catch((err: any) => console.log(err)),
    [closeDialog, setRefresh]
  );

  const handleEditDialogClose = useCallback(
    (info: IDialogInfo<IFormRefProps | undefined>) =>
      info.ref?.current?.onReset(),
    []
  );

  const editDialogContent = useCallback(
    (data: { name: string; url: string; id: string }) => (
      <AddProjectForm
        data={{
          projectName: data.name,
          projectUrl: data.url,
          id: data.id,
        }}
        ref={formRef}
      />
    ),
    []
  );

  const editDialogConfig = useMemo<IDialogInfo<IFormRefProps | undefined>>(
    () => ({
      title: "Edit Project",
      ref: formRef,
    }),
    []
  );

  const handleEditDialog = useCallback(
    (
      data = {
        name: "",
        url: "",
        id: "",
      }
    ) => {
      const info: IDialogInfo<IFormRefProps | undefined> = editDialogConfig;
      info.content = editDialogContent(data);
      info.handleConfirm = () => handleEditDialogConfirm(data, info);
      info.handleClose = () => handleEditDialogClose(info);
      updateDialogInfo?.(info);
      openDialog?.();
    },
    [
      editDialogConfig,
      editDialogContent,
      handleEditDialogConfirm,
      handleEditDialogClose,
      updateDialogInfo,
      openDialog,
    ]
  );

  useEffect(() => {
    FolderAPI.getFolderInfo().then((res: any) => {
      // setLoading(res.project?.map(() => false))
      setProjectData(res.project);
    });
  }, [refresh]);

  const CardTitle = useCallback((item: any) => {
    return (
      <>
        <span>{item.name}</span>
        <Tag
          color={item.status ? "success" : "default"}
          style={{ marginLeft: "10px" }}
        >
          <span>{item.status ? "在线" : "离线"}</span>
        </Tag>
        <span style={{ color: "rgba(0, 0, 0, .5)" }}>{item.timer}</span>
      </>
    );
  }, []);

  const openConfirmDialog = useCallback(
    (item: any) => {
      const info: IDialogInfo<IFormRefProps | undefined> = {
        title: "确认删除",
        handleConfirm: async () => {
          await FolderAPI.deleteFolder(item.id);

          setRefresh();
          closeDialog?.();
        },
      };

      updateDialogInfo?.(info);
      openDialog?.();
    },
    [closeDialog, openDialog, setRefresh, updateDialogInfo]
  );

  return (
    <Content
      style={{
        padding: 24,
        margin: 0,
        minHeight: 280,
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      {projectData?.map((item: any, index) => {
        return (
          <Card
            key={item.id}
            hoverable
            style={{ marginBottom: 16 }}
            styles={{
              body: { padding: "10px 24px" },
              extra: {
                position: "absolute",
                right: "24px",
                zIndex: 99,
              },
            }}
            title={CardTitle(item)}
            onClick={() =>
              navigate(`/detail/project_${item.name}?projectId=${item.id}`)
            }
            extra={
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDialog(item);
                  }}
                  icon={<EditOutlined />}
                  style={{ marginRight: "20px" }}
                />
                <Button
                  danger={item.status ? true : false}
                  type="primary"
                  icon={<PoweroffOutlined />}
                  loading={loading[item.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeStatus(item, !item.status);
                  }}
                >
                  {item.status ? "Stop" : "Start"}
                </Button>
              </>
            }
          >
            <RightClickMenu item={item} handleClick={openConfirmDialog} />
            <div style={{ marginBottom: "10px" }}>
              <ChromeOutlined style={{ marginRight: "10px" }} />
              <span>{item.url}</span>
            </div>
            <div>
              <UnorderedListOutlined style={{ marginRight: "10px" }} />
              <span>{item.rules.length} Rules</span>{" "}
            </div>
          </Card>
        );
      })}
    </Content>
  );
};

export default HomeDetail;
