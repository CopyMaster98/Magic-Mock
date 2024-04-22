import { theme } from "antd";
import { Content } from "antd/es/layout/layout"

const HomeDetail: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return <Content
  style={{
    padding: 24,
    margin: 0,
    minHeight: 280,
    background: colorBgContainer,
    borderRadius: borderRadiusLG,
  }}
>
  Content
</Content>
}

export default HomeDetail