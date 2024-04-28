import { Breadcrumb, Button, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../../../utils/fetch";
import { useData } from "../../../context";
import { FolderAPI } from "../../../api";
import "./index.css";

const DetailInfo: React.FC<{
  pathname: string;
}> = (props) => {
  const { pathname } = props;
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { setSpinning } = useData();
  const location = useLocation();

  useEffect(() => {
    FolderAPI.getFolderDetail(pathname, {}, setSpinning).then((res) => {
      console.log(res);
    });
  }, [pathname, setSpinning]);

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
            // onClick={handleOpenDialog}
            // icon={<PlusOutlined />}
          >
            Add Rule
          </Button>
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
