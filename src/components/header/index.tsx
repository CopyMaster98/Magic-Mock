
import { Layout, Menu, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { requestFn } from '../../utils'
import { Link, useLocation } from 'react-router-dom'
import { useCallback, useContext, useMemo, useRef, } from 'react'
import { ProviderContext } from '../../context'
import { headerItems } from '../../constant/header'
import AddProjectForm from '../add-project-form'
import { IDialogInfo } from '../../types/dialog'
const { Header: LayoutHeader,  } = Layout
const Header: React.FC<{
  items: any[]
}> = (props) => {
  type IFormRefProps = {
    onValidate: (arg?: any) => any,
    onReset: (arg?: any) => any
  }
  const { items } = props
  const { openDialog, updateDialogInfo, closeDialog } = useContext(ProviderContext)
  const location = useLocation();
  const defaultKey = useMemo(() => {
    const pathname = location.pathname

    if(pathname === '/' || !headerItems.find(item => pathname.slice(1) === item.key))
        return 'home'
    
    return pathname.slice(1)
  }, [location.pathname])
  const formRef = useRef<IFormRefProps>()
  const handleOpenDialog = useCallback(() => {
    const info: IDialogInfo<IFormRefProps | undefined> = {
      title: 'Add Project',
      content: <AddProjectForm ref={formRef} />,
      ref: formRef, 
      handleConfirm: () => {
        info.ref?.current?.onValidate().then(async(formValue: {
          projectName: string,
          projectUrl: string
        }) => {
          console.log(formValue)
          await requestFn.post('/create', {
            folderName: formValue.projectName
          })
          info.ref?.current?.onReset()
          closeDialog?.()
      }).catch((err: any) => console.log(err))
      },
      handleClose: () => {
        info.ref?.current?.onReset()
      }
    }
    updateDialogInfo?.(info)
    openDialog?.()
  }, [closeDialog, openDialog, updateDialogInfo])

  return <>
    <LayoutHeader style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[defaultKey]}
          items={items.map(item => ({
            key: item.key,
            label: <Link to={item.key === 'home' ? '/' : item.key}>{item.label}</Link>
          }))}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Button type="primary" onClick={handleOpenDialog} icon={<PlusOutlined />}>
            Add Project
        </Button>
      </LayoutHeader>
  </>
}

export default Header
