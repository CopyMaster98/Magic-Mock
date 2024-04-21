import React, { useState } from "react";
import { Breadcrumb, Layout, Menu, MenuProps, theme } from 'antd';
import { headerItems } from "../../constant/header";
import { LaptopOutlined, NotificationOutlined, UserOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined } from '@ant-design/icons';
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  return  <><Sider width={200} trigger={
    collapsed ? <MenuUnfoldOutlined className='collapsed-icon'/> : <MenuFoldOutlined className='collapsed-icon'/>
  } style={{ background: colorBgContainer }} collapsible collapsed={collapsed} onCollapse={(value: boolean) => setCollapsed(value)}>
    <Menu
      mode="inline"
      defaultSelectedKeys={['1']}
      defaultOpenKeys={['sub1']}
      style={{ height: '100%', borderRight: 0 }}
      items={items2}
    />
    
  </Sider>
  <Layout style={{ padding: '0 24px 24px' }}>
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
  </Layout></>
}


export default Detail

