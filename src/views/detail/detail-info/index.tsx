import { Breadcrumb, theme } from "antd"
import { Content } from "antd/es/layout/layout"
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../../../utils/fetch";
import { useData } from "../../../context";


const DetailInfo: React.FC<{
  pathname: string
}> = (props) => {
  const { pathname } = props
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { setSpinning } = useData()
  const location = useLocation();

  useEffect(() => {
    return () => {
      get(`/folder/project/${pathname}`, {}, setSpinning).then(res => {
        console.log(res)
      })
    }
  }, [pathname, setSpinning])

  return (
    <>
    <Breadcrumb style={{ margin: '16px 0' }} items={location.pathname.split('/').filter(Boolean).map(item => ({
    title: item.slice(0, 1).toUpperCase() + item.slice(1)
  }))} separator=">">
      {/* 如果需要自定义分隔符，可以在 Breadcrumb 组件中设置 separator 属性 */}
    </Breadcrumb>
    <Content
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
    </>
  )
}

export default DetailInfo