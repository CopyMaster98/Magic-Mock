import { Button, Card, Tag, theme } from "antd";
import { Content } from "antd/es/layout/layout"
import { useCallback, useEffect, useMemo, useState } from "react";
import { PoweroffOutlined, EditOutlined, UnorderedListOutlined, ChromeOutlined } from '@ant-design/icons'
import { useData } from "../../../context";
import { get, post } from "../../../utils/fetch";
import { FolderAPI, ProjectAPI } from "../../../api";

const HomeDetail: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  const { refresh } = useData()
  const [projectData, setProjectData] = useState([])
  const [loadings, setLoadings] = useState<any>({});

  const handleStart = useCallback(async (project: any) => {
    setLoadings((oldValue: any) => ({
      ...oldValue,
      [project.name]: true
    }))
    ProjectAPI.startProject({
      name: project.name,
      url: project.url
    }).then(res => {
      console.log(res)
    }).finally(() => {
      setLoadings((oldValue: any) => ({
        ...oldValue,
        [project.name]: false
      }))
    })
  }, [])

  useEffect(() => {
    return () => {
      FolderAPI.getFolderInfo().then((res: any) => {
        // setLoadings(res.project?.map(() => false))
        setProjectData(res.project)
      })
    }
  }, [refresh])
  

  const CardTitle = useCallback((item: any) => {
    return <>
      <span>{item.name}</span>
      <Tag color={item.status ? 'success' : 'default'} style={{marginLeft: '10px'}}>
        <span>{item.status ? '在线' : '离线'}</span>
      </Tag>
      <span style={{ color: 'rgba(0, 0, 0, .5)'}}>{item.timer}</span>
    </>
  }, [])

  return <Content
  style={{
    padding: 24,
    margin: 0,
    minHeight: 280,
    background: colorBgContainer,
    borderRadius: borderRadiusLG,
  }}
>
  {
    projectData?.map((item: any, index) => {
      return <Card
      key={item.name} 
      hoverable
      style={{ marginBottom: 16 }}
      styles={{
        body: { padding: '10px 24px' }
      }}
      title={CardTitle(item)}
      extra={  
      <>
        <Button icon={<EditOutlined />} style={{marginRight: '20px'}} />  
      <Button
        danger={item.status ? true: false}
        type="primary"
        icon={<PoweroffOutlined />}
        loading={loadings[item.name]}
        onClick={() => handleStart(item)}
      >
        {
          item.status ? 'Stop' : 'Start'
        }
      </Button>
      </>
    }
    > 
      <div style={{ marginBottom: '10px' }}><ChromeOutlined style={{ marginRight: '10px' }} /><span>{item.url}</span></div>
      <div><UnorderedListOutlined style={{ marginRight: '10px' }} /><span>12 Rules</span> </div>
      {/* <span>12 data</span> */}
    </Card>
    })
  }

</Content>
}

export default HomeDetail