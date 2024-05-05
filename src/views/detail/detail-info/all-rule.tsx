import { Card, Skeleton } from "antd";
import Meta from "antd/es/card/Meta";
import { SettingOutlined } from "@ant-design/icons";
import RightClickMenu from "../../../components/right-click-menu";

const AllRule: React.FC<{
  rules: any[];
}> = (props) => {
  const { rules } = props;
  return (
    <>
      {rules.map((item) => (
        <Card
          style={{ width: 300, margin: 30, marginLeft: 0 }}
          actions={[<SettingOutlined key="setting" />]}
        >
          <RightClickMenu item={item} />
          <Skeleton loading={false} avatar active>
            <Meta title={item.name} description="This is the description" />
          </Skeleton>
        </Card>
      ))}
    </>
  );
};

export default AllRule;
