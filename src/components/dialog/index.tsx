import { Modal, ModalProps } from "antd";
import { useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { DialogType } from "../../types";
import { useData } from "../../context";

const Dialog: React.FC<{
  open: boolean;
  handleClose: (arg?: any) => any;
  dialogConfig?: DialogType.IDialogInfo;
  modalConfig?: ModalProps;
}> = (props) => {
  const { open, handleClose, dialogConfig, modalConfig } = props;
  const [disabled, setDisabled] = useState(true);
  const { updateDialogInfo, updateModalConfig } = useData();
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef<HTMLDivElement>(null);
  const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
    if (dialogConfig?.handleConfirm) dialogConfig.handleConfirm();
  };
  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    if (dialogConfig?.handleClose) dialogConfig.handleClose();

    handleClose();
    updateDialogInfo?.();
    updateModalConfig?.();
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
      styles={{
        body: {
          maxHeight: "50vh",
          overflowY: "auto",
        },
      }}
      title={
        <div
          style={{
            width: "100%",
            cursor: "move",
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
          {dialogConfig?.title ?? "Draggable Modal"}
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
      {...modalConfig}
    >
      {dialogConfig?.content}
    </Modal>
  );
};

export default Dialog;
