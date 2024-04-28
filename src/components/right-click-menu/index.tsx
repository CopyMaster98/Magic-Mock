import { Dropdown, Menu } from "antd";
import { useState } from "react";

const RightClickMenu: React.FC = () => {
  const handleMenuClick = (e: any) => {
    console.log("点击了菜单项", e);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="1">菜单项1</Menu.Item>
      <Menu.Item key="2">菜单项2</Menu.Item>
      <Menu.Item key="3">菜单项3</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["contextMenu"]}>
      <div
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: 100,
          height: 100,
          background: "#f0f0f0",
          textAlign: "center",
          lineHeight: "100px",
        }}
      >
        右键点击这里显示菜单
      </div>
    </Dropdown>
  );
};

export default RightClickMenu;
