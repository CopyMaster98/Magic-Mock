import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, MenuProps, theme } from 'antd';
import { LaptopOutlined, NotificationOutlined, UserOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, FolderOutlined } from '@ant-design/icons';
import { Link } from "react-router-dom";
import { get } from "../../utils/fetch";
import { FolderAPI } from '../../api'
import { useData } from "../../context";
import DetailInfo from "./detail-info";
import { url } from "../../hooks";
const { Content, Sider } = Layout;
const items2: MenuProps['items'] = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
  (icon, index) => {
    const key = String(index + 1);

    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label: `subnav ${key}`,

      children: new Array(4).fill(null).map((_, j) => {
        const subKey = index * 4 + j + 1;
        return {
          key: subKey,
          label: `option${subKey}`,
        };
      }),
    };
  },
);



const Detail: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const { refresh } = useData()
  const [projectData, setProjectData] = useState()
  const pathname = url.usePathname()
  const isDetailInfo = useMemo(() => pathname.length > 1, [pathname.length])
  const currentPathname = useMemo(() => {
    return pathname[pathname.length - 1]
  }, [pathname])

  useEffect(() => {
    return () => {
      FolderAPI.getFolderInfo().then((res: any) => {
        const data = res.project?.map((item: any) => ({
          icon: React.createElement(FolderOutlined),
          key: item.name,
          label: <Link to={`/detail/${item.name}`}>{item.name}</Link>,
        }))

        setProjectData(data)
      })
    }
  }, [refresh])

  return  <><Sider width={200} trigger={
    collapsed ? <MenuUnfoldOutlined className='collapsed-icon'/> : <MenuFoldOutlined className='collapsed-icon'/>
  } style={{ background: colorBgContainer }} collapsible collapsed={collapsed} onCollapse={(value: boolean) => setCollapsed(value)}>
    <Menu
      mode="inline"
      defaultSelectedKeys={[currentPathname]}
      // defaultOpenKeys={['sub1']}
      style={{ height: '100%', borderRight: 0 }}
      items={projectData}
    />
  </Sider>
  <Layout style={{ padding: '0 24px 24px' }}>
  {isDetailInfo ? <DetailInfo pathname={currentPathname}  /> : <Content
      style={{
        padding: 24,
        margin: 0,
        minHeight: 280,
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      Content
    </Content>}
  </Layout></>
}


export default Detail

