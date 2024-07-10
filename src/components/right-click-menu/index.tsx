import { Button, Dropdown, Menu } from "antd";
import { useState } from "react";

const RightClickMenu: React.FC<{
  item: any;
  handleClick?: (arg: any) => void;
}> = (props) => {
  const { item, handleClick } = props;
  const handleMenuClick = (e: any) => {
    e.domEvent.stopPropagation();
    handleClick && handleClick(item);
    console.log("点击了菜单项", item);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item
        key="1"
        style={{
          padding: 0,
        }}
      >
        <Button
          danger={true}
          type="primary"
          // icon={<PoweroffOutlined />}
          // loading={loadings[item.name]}
          // onClick={(e) => {
          //   e.stopPropagation();
          //   handleChangeStatus(item, !item.status);
          // }}
        >
          Delete
        </Button>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["contextMenu"]}>
      <div
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "#f0f0f0",
          textAlign: "center",
          top: 0,
          backgroundColor: "transparent",
        }}
      ></div>
    </Dropdown>
  );
};

export default RightClickMenu;
