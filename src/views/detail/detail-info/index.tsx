import { Avatar, Breadcrumb, Button, Card, Skeleton, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SettingOutlined,
  EllipsisOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { get } from "../../../utils/fetch";
import { useData } from "../../../context";
import { FolderAPI } from "../../../api";
import "./index.css";
import Meta from "antd/es/card/Meta";

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

        <div className="container">
          <Card
            style={{ width: 300, marginTop: 16 }}
            actions={[
              <SettingOutlined key="setting" />,
              // <EditOutlined key="edit" />,
              // <EllipsisOutlined key="ellipsis" />,
            ]}
          >
            <Skeleton loading={false} avatar active>
              <Meta
                avatar={
                  <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=2" />
                }
                title="Card title"
                description="This is the description"
              />
            </Skeleton>
          </Card>
        </div>
      </Content>
    </>
  );
};

export default DetailInfo;
