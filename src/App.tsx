import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Home from "./views/home";
import Dialog from "./components/dialog";
import { ProviderContext } from "./context/index";
import { DialogType } from "./types/index";
import { Spin } from "antd";
import { websocket } from "./hooks";
import { ModalConfig } from "antd/es/config-provider/context";

function App() {
  const [openDialog, setOpenDialog] = useState(false);
  const matchedMap = useRef(new Map());
  const [refresh, setRefresh] = useState(0);
  const [dialogConfig, setDialogInfo] = useState<DialogType.IDialogInfo>();
  const [modalConfig, setModalConfig] = useState<ModalConfig>();
  const [spinning, setSpinning] = useState(false);
  const handleDialog = useCallback((flag: boolean) => {
    setOpenDialog(flag);
  }, []);

  const updateSpinning = useCallback((spinning: boolean) => {
    return setSpinning(spinning);
  }, []);

  const handleUpdateProjectInfo = useCallback((data: string) => {
    if (data) {
      const [matchedIdStr, projectNameStr, urlStr, portStr, typeStr] =
        data.split("δ");
      const matchedId = matchedIdStr.split("matchedId=")[1]?.trim() || "";
      const projectName = projectNameStr.split("projectName=")[1]?.trim() || "";
      const url = urlStr.split("url=")[1]?.trim() || "";
      const type = typeStr.split("type=")[1]?.trim() || "";
      const mapName = `${projectName}&${url}`;

      if (!matchedMap.current.has(mapName))
        matchedMap.current.set(mapName, new Map());

      if (!matchedMap.current.get(mapName).has(type.toLowerCase()))
        matchedMap.current.get(mapName).set(type.toLowerCase(), new Map());

      matchedMap.current
        .get(mapName)
        .get(type.toLowerCase())
        .set(
          matchedId,
          (matchedMap.current
            .get(mapName)
            .get(type.toLowerCase())
            .get(matchedId) || 0) + 1
        );
    }

    setTimeout(() => setRefresh((oldValue) => oldValue + 1));
  }, []);

  const handleRefresh = useCallback(() => {
    setTimeout(() => setRefresh((oldValue) => oldValue + 1));
  }, []);

  const handleOpenDialog = useCallback(() => {
    handleDialog(true);
  }, [handleDialog]);

  const handleCloseDialog = useCallback(() => {
    handleDialog(false);
  }, [handleDialog]);

  const handleUpdateDialogInfo = useCallback(
    (data?: DialogType.IDialogInfo) => setDialogInfo(data ?? {}),
    []
  );

  const handleUpdateModalConfig = useCallback(
    (data?: ModalConfig) => setModalConfig(data ?? {}),
    []
  );

  websocket.useCreateWebSocket(handleUpdateProjectInfo);

  return (
    <ProviderContext.Provider
      value={{
        theme: "light",
        refresh,
        matchedMap: matchedMap.current,
        setRefresh: handleRefresh,
        setSpinning: updateSpinning,
        openDialog: handleOpenDialog,
        closeDialog: handleCloseDialog,
        updateDialogInfo: handleUpdateDialogInfo,
        updateModalConfig: handleUpdateModalConfig,
      }}
    >
      <div className="App">
        <Home />
        <Dialog
          open={openDialog}
          handleClose={() => handleDialog(false)}
          modalConfig={modalConfig}
          dialogConfig={dialogConfig}
        />
        <Spin spinning={spinning} fullscreen />
      </div>
    </ProviderContext.Provider>
  );
}

export default App;
