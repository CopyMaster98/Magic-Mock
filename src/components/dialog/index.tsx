import { Button, Modal, ModalProps } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { DialogType } from "../../types";
import { useData } from "../../context";
import "./index.css";

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
  const handleOk = async () => {
    if (dialogConfig?.handleConfirm) dialogConfig.handleConfirm();
  };
  const handleCancel = () => {
    if (dialogConfig?.handleClose) dialogConfig.handleClose();

    handleClose();
    updateDialogInfo?.();
    updateModalConfig?.();
    sessionStorage.setItem("isFetch", "0");
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

  const handleModalRender = useCallback(
    (modal: any) => (
      <Draggable
        disabled={disabled}
        bounds={bounds}
        nodeRef={draggleRef}
        onStart={(event, uiData) => onStart(event, uiData)}
      >
        <div ref={draggleRef}>{modal}</div>
      </Draggable>
    ),
    [bounds, disabled]
  );
  // useEffect(() => {
  //   const handleKeyDown = (event: any) => {
  //     if (event.key === "Enter") {
  //       handleOk();
  //     }
  //   };

  //   if (open) window.addEventListener("keydown", handleKeyDown);

  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // });

  const [dialogTip, setDialogTip] = useState(false);

  const timer = useRef<any>();

  useEffect(() => {
    if (!(dialogConfig?.title === "Add Rule")) {
      if (dialogTip) setDialogTip(false);
      return;
    }

    timer.current = setInterval(() => {
      const isFetch = sessionStorage.getItem("isFetch") === "1";
      if (isFetch !== dialogTip) setDialogTip(isFetch);
    }, 500);

    return () => clearInterval(timer.current);
  }, [dialogConfig, dialogTip]);

  return (
    <Modal
      styles={{
        body: {
          maxHeight: "50vh",
          overflowY: "auto",
          padding: "20px 30px",
          scrollbarWidth: "none",
        },
      }}
      title={
        <>
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
          >
            {dialogConfig?.title ?? "Draggable Modal"}
            {dialogTip && (
              <span
                className="dialog-tip recognizable-tip"
                onClick={async () => {
                  let url = "",
                    config: Partial<Request> = {},
                    clipboardValue = "";

                  try {
                    clipboardValue = await navigator.clipboard.readText();
                  } catch (error) {}

                  const fetchRegex =
                    /fetch\(\s*['"]([^'"]+)['"]\s*,\s*({[\s\S]*})\s*\)/;

                  if (!clipboardValue.match(fetchRegex)) return;

                  url = clipboardValue.match(fetchRegex)?.[1] ?? "";
                  config = eval(
                    `(${clipboardValue.match(fetchRegex)?.[2] ?? "{}"})`
                  );

                  let ruleConfig: any = {
                    ruleName: url,
                    rulePattern: url,
                  };

                  if (Object.keys(config)) {
                    ruleConfig = {
                      ...ruleConfig,
                      ruleMethod: [config.method],
                      responseStatusCode: 200,
                      requestHeaderType: "json",
                      requestHeaderJSON: config.headers ?? {},
                      resourceType: ["XHR", "Fetch"],
                    };
                  }
                  if (config.body) {
                    let payload = JSON.parse(config.body as unknown as string);

                    if (Object.keys(payload).length) {
                      ruleConfig.payloadJSON = payload;
                    }
                  }
                  console.log(ruleConfig);

                  dialogConfig?.handleUpdateForm?.(ruleConfig);
                }}
              >
                DISCOVERING RECOGNIZABLE CONTENT
              </span>
            )}
          </div>
          {dialogConfig?.title === "Multiple Create & Save" && (
            <span
              style={{
                position: "absolute",
                bottom: "32px",
                transform: "translateY(50%)",
                cursor: "default",
              }}
            >
              Count: {dialogConfig?.count ?? 0}
            </span>
          )}
        </>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      modalRender={handleModalRender}
      {...modalConfig}
    >
      {dialogConfig?.content}
    </Modal>
  );
};

export default Dialog;
