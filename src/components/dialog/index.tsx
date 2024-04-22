import { Modal } from "antd";
import { useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';
import { DialogType } from "../../types";

const Dialog: React.FC<{
  open: boolean,
  handleClose: (arg?: any) => any
  dialogConfig?: DialogType.IDialogInfo
}> = (props) => {
  const { open, handleClose, dialogConfig } = props
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);
  const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
    if(dialogConfig?.handleConfirm) 
      dialogConfig.handleConfirm()
  };
  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    if(dialogConfig?.handleClose)
      dialogConfig.handleClose()
    handleClose()
  };


  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };
  return (
    <Modal
      title={
        <div
          style={{
            width: '100%',
            cursor: 'move',
          }}
          onMouseOver={() => {
            if (disabled) {
              setDisabled(false);
            }
          }}
          onMouseOut={() => {
            setDisabled(true);
          }}
          onFocus={() => {}}
          onBlur={() => {}}
          // end
        >
          {dialogConfig?.title ?? 'Draggable Modal'}
        </div>
      }
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        modalRender={(modal) => (
          <Draggable
            disabled={disabled}
            bounds={bounds}
            nodeRef={draggleRef}
            onStart={(event, uiData) => onStart(event, uiData)}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
      >{dialogConfig?.content}</Modal>
  )
}

export default Dialog