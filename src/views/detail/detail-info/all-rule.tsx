import { Card, Skeleton, Switch, Tag } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";
import { useNavigate } from "../../../hooks/navigate";
import { url } from "../../../hooks";
const AllRule: React.FC<{
  rules: any[];
}> = (props) => {
  const { rules } = props;
  const navigate = useNavigate();
  const { pathname, search } = url.usePathname();
  const handleNavigate = (item: any) => {
    navigate(`/${pathname.join("/")}/${item.key}${search}&ruleId=${item.id}`);
  };
  return (
    <>
      {rules.map((item) => (
        <Card
          key={item.id}
          style={{ width: 300, margin: 30, marginLeft: 0 }}
          actions={[
            <SettingOutlined
              key="setting"
              onClick={() => handleNavigate(item)}
            />,
          ]}
        >
          <RightClickMenu item={item} />
          <Skeleton loading={false} avatar active>
            <Meta
              title={
                <>
                  <span>{item.name}</span>
                  <Switch
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                    defaultChecked
                    style={{ float: "right" }}
                  />
                </>
              }
              description="This is the description"
            />
          </Skeleton>
        </Card>
      ))}
    </>
  );
};

export default AllRule;
