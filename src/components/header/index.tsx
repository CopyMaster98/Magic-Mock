import { Layout, Menu, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { requestFn } from "../../utils";
import { Link } from "react-router-dom";
import { useCallback, useMemo, useRef } from "react";
import { useData } from "../../context";
import { headerItems } from "../../constant/header";
import AddProjectForm from "../project-form";
import { IDialogInfo, IFormRefProps } from "../../types/dialog";
import { url } from "../../hooks";
import { FolderAPI } from "../../api";
const { Header: LayoutHeader } = Layout;
const Header: React.FC<{
  items: any[];
}> = (props) => {
  const { items } = props;
  const { openDialog, updateDialogInfo, closeDialog, setRefresh } = useData();
  const { pathname } = url.usePathname();
  const defaultKey = useMemo(() => {
    if (
      !pathname.length ||
      !headerItems.find((item) => pathname[0] === item.key)
    )
      return "home";

    return pathname[0];
  }, [pathname]);

  const formRef = useRef<IFormRefProps>();
  const openDialogInfo = useMemo(
    () => ({
      title: "Add Project",
      content: <AddProjectForm ref={formRef} />,
      ref: formRef,
      handleConfirm: () => {
        openDialogInfo.ref?.current
          ?.onValidate()
          .then(
            async (formValue: { projectName: string; projectUrl: string }) => {
              await FolderAPI.createFolder({
                name: formValue.projectName,
                url: formValue.projectUrl ?? "",
              });
              setRefresh();
              openDialogInfo.ref?.current?.onReset();
              closeDialog?.();
            }
          )
          .catch((err: any) => console.log(err));
      },
      handleClose: () => openDialogInfo.ref?.current?.onReset(),
    }),
    [closeDialog, setRefresh]
  );
  const handleOpenDialog = useCallback(() => {
    updateDialogInfo?.(openDialogInfo);
    openDialog?.();
  }, [openDialog, openDialogInfo, updateDialogInfo]);

  return (
    <>
      <LayoutHeader
        style={{ display: "flex", alignItems: "center" }}
        key={defaultKey}
      >
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[defaultKey]}
          items={items.map((item) => ({
            key: item.key,
            label: (
              <Link to={item.key === "home" ? "/" : item.key}>
                {item.label}
              </Link>
            ),
          }))}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Button
          type="primary"
          onClick={handleOpenDialog}
          // icon={<PlusOutlined />}
        >
          Add Project
        </Button>
      </LayoutHeader>
    </>
  );
};

export default Header;
