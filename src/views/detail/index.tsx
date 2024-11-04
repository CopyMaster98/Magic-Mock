import React, { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Layout, Menu, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { FolderAPI } from "../../api";
import { useData } from "../../context";
import DetailInfo from "./detail-info";
import { url } from "../../hooks";
import "./index.css";

const { Content, Sider } = Layout;

const Detail: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const { refresh, setRefresh } = useData();
  const [updateMenu, setUpdateMenu] = useState(0);
  const [projectData, setProjectData] = useState<any>([]);
  const { pathname, search } = url.usePathname();
  const prevPathName = useRef<string[]>();
  const isDetailInfo = useMemo(() => pathname.length > 1, [pathname.length]);
  const currentPathname = useMemo(() => {
    const paths =
      pathname.length > 1 ? pathname.slice(1) : [pathname[pathname.length - 1]];

    if (!prevPathName.current) prevPathName.current = paths;

    if (prevPathName.current !== paths && paths?.length === 1) {
      prevPathName.current = paths;
      setRefresh();
    }
    setUpdateMenu((prev) => prev + 1);

    return paths;
  }, [pathname, setRefresh]);

  const currentProject = useMemo(() => {
    return projectData?.find((item: any) => item?.key === currentPathname[0]);
  }, [currentPathname, projectData]);

  useEffect(() => {
    FolderAPI.getFolderInfo().then((res: any) => {
      const data = res.project?.map((item: any) => {
        const folderInfo: any = {
          id: item.id,
          icon: React.createElement(FolderOutlined),
          key: "project_" + item.name,
          label: (
            <Link to={`/detail/project_${item.name}?projectId=${item.id}`}>
              project_{item.name}
            </Link>
          ),
          _status: +item.status,
          _url: item.url,
          _name: item.name,
        };
        if (item.rules.length > 0) {
          folderInfo.children = [...item.rules]?.map((rule: any) => {
            let ruleName = rule?.name;

            if (ruleName.includes(".config.json")) {
              ruleName = ruleName.split(".config.json")[0];
            }

            const ruleInfo = {
              id: rule?.id,
              key: "rule_" + encodeURIComponent(ruleName),
              name: encodeURIComponent(ruleName),
              label: (
                <Link
                  to={`/detail/project_${encodeURIComponent(
                    item.name
                  )}/rule_${encodeURIComponent(ruleName)}?projectId=${
                    item.id
                  }&ruleId=${rule.id}&type=mock`}
                >
                  rule_{ruleName}
                </Link>
              ),
              content: rule?.content,
              parent: item,
            };

            return ruleInfo;
          });
        }

        if (item.cacheData.length > 0) {
          folderInfo.cacheData = item.cacheData.map((cacheData: any) => ({
            ...cacheData,
            key: "cache_" + cacheData.name,
            parent: item,
          }));
        }

        return folderInfo;
      });

      setProjectData(data);
    });
  }, [refresh]);

  return (
    <>
      {projectData.length ? (
        <Sider
          width={200}
          trigger={
            collapsed ? (
              <MenuUnfoldOutlined className="collapsed-icon" />
            ) : (
              <MenuFoldOutlined className="collapsed-icon" />
            )
          }
          style={{ background: colorBgContainer }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value: boolean) => setCollapsed(value)}
        >
          <Menu
            key={updateMenu}
            mode="inline"
            defaultSelectedKeys={currentPathname}
            defaultOpenKeys={[currentPathname[0]]}
            style={{ height: "100%", borderRight: 0 }}
            items={projectData}
          />
        </Sider>
      ) : null}
      <Layout style={{ padding: "0 24px 24px" }}>
        {isDetailInfo ? (
          <DetailInfo
            pathname={currentPathname}
            project={currentProject}
            rules={
              projectData?.find(
                (item: any) => item.id === search.split("projectId=")[1]
              )?.children || []
            }
            cacheData={
              projectData?.find(
                (item: any) => item.id === search.split("projectId=")[1]
              )?.cacheData || []
            }
          />
        ) : (
          <Content
            style={{
              position: "relative",
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {projectData?.length > 0 ? (
              "Content"
            ) : (
              <Empty
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </Content>
        )}
      </Layout>
    </>
  );
};

export default Detail;
