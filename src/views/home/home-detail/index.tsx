import {
  Button,
  Card,
  Divider,
  Input,
  InputRef,
  Select,
  Space,
  Tag,
  theme,
} from "antd";
import { Content } from "antd/es/layout/layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PoweroffOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  ChromeOutlined,
  DeleteOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { useData } from "../../../context";
import { FolderAPI, ProjectAPI } from "../../../api";
import { IDialogInfo, IFormRefProps } from "../../../types/dialog";
import AddProjectForm from "../../../components/project-form";
import { useNavigate } from "../../../hooks/navigate";
import RightClickMenu from "../../../components/right-click-menu";
import { addFolderUrl, deleteFolderUrl } from "../../../api/folder";
import "./index.css";

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
        type={"edit"}
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

  const [url, setUrl] = useState("");
  const inputRef = useRef<InputRef>(null);
  const [inputStatus, setInputStatus] = useState<"" | "warning" | "error">("");

  const [errorMessage, setErrorMessage] = useState(
    "Please enter the correct url address!"
  );

  const onUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    if (inputStatus === "error") setInputStatus("");
  };

  const addItem = useCallback(
    async (item: any, url: string) => {
      if (
        !url.trim().length ||
        item.urlOptions.find((item: any) => item === url)
      ) {
        setErrorMessage("Url is already exists!");
        setInputStatus("error");
        return;
      }

      const reg = /^(http|https):\/\/(\S+)$/;
      if (url.length > 0 && !reg.test(url)) {
        setErrorMessage("Please enter the correct url address!");
        setInputStatus("error");
        return;
      }
      await addFolderUrl({
        pathname: item.name,
        url: item.url,
        id: item.id,
        newUrl: url,
      });
      setUrl("");
      setRefresh();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [setRefresh]
  );

  const handleDeleteProjectUrl = useCallback(
    (item: any, url: string) => {
      const info: IDialogInfo<IFormRefProps | undefined> = {
        title: "确认删除",
        handleConfirm: async () => {
          await deleteFolderUrl({
            pathname: item.name,
            url: item.url,
            id: item.id,
            deleteUrl: url,
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

  const selectValue = useRef(new Map());

  const handleChangeProjectUrl = useCallback(
    async (item: any, url: string) => {
      try {
        const response = await FolderAPI.updateFolder({
          pathname: item.name,
          url,
          id: item.id,
        });

        if (response.code !== -1 && selectValue.current.has(item.id))
          selectValue.current.set(item.id, url);
      } catch (error) {
        console.log(error);
      }
      console.log(selectValue.current);
      setRefresh();
    },
    [setRefresh]
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
            className="project-card"
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

                <Select
                  style={{ width: 300, marginRight: 20 }}
                  placeholder="Select Default URL"
                  showSearch
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  value={
                    selectValue.current.get(item.id) ||
                    item.urlOptions.find((_item: any) => _item === item.url)
                  }
                  onChange={(e) => handleChangeProjectUrl(item, e)}
                  disabled={item.status}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space style={{ padding: "0 8px 4px" }}>
                        <Input
                          placeholder="Please enter item"
                          ref={inputRef}
                          value={url}
                          onChange={onUrlChange}
                          onKeyDown={(e) => e.stopPropagation()}
                          status={inputStatus}
                        />
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.preventDefault();
                            addItem(item, url);
                          }}
                          disabled={
                            !url.trim().length || inputStatus === "error"
                          }
                        >
                          Add URL
                        </Button>
                      </Space>
                      <Space>
                        <span
                          style={{
                            display: inputStatus === "error" ? "block" : "none",
                            marginLeft: "10px",
                            color: "#ff4d4f",
                          }}
                        >
                          {errorMessage}
                        </span>
                      </Space>
                    </>
                  )}
                  options={(item.urlOptions || []).map((item: any) => ({
                    label: item,
                    value: item,
                  }))}
                  optionRender={(option: any) => (
                    <div
                      style={{
                        position: "relative",
                        marginRight: "20px",
                      }}
                    >
                      <div>
                        {/* <Tag
                          color={option.data.a === 123 ? "#1677ff" : "#52c41a"}
                        >
                          <span>
                            {option.data.a !== 123 ? "URL" : "Resource"}
                          </span>
                        </Tag> */}
                        <span
                          style={{
                            wordBreak: "break-all",
                            whiteSpace: "normal",
                          }}
                        >
                          {option.label}
                        </span>
                      </div>
                      {item.url !== option.value && (
                        <DeleteOutlined
                          style={{
                            position: "absolute",
                            right: -20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 99,
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteProjectUrl(
                              item,
                              option.value as string
                            );
                          }}
                        />
                      )}
                    </div>
                  )}
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
            <RightClickMenu
              item={item}
              menuButtons={
                <Button
                  danger={true}
                  type="primary"
                  onClick={() => openConfirmDialog(item)}
                >
                  Delete
                </Button>
              }
            />
            <div style={{ marginBottom: "10px" }}>
              <ChromeOutlined style={{ marginRight: "10px" }} />
              <span>{item.url}</span>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <UnorderedListOutlined style={{ marginRight: "10px" }} />
              <span style={{ marginRight: "10px" }}>
                <span style={{ fontWeight: 700 }}>{item.rules.length}</span>{" "}
                Rules
              </span>
              <span>
                <span style={{ fontWeight: 700 }}>{item.cacheData.length}</span>{" "}
                Caches
              </span>
            </div>
            <div>
              <CloudOutlined style={{ marginRight: "10px" }} />
              <span>Online</span>
            </div>
          </Card>
        );
      })}
    </Content>
  );
};

export default HomeDetail;
