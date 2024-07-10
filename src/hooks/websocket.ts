import { useEffect } from "react";
let timer: any = null
const initWebSocket = (callback: any) => {
  const ws = new WebSocket('ws://localhost:9090');

    ws.onopen = function() {
      console.log('Connected to server');
      ws.send('React: open');
    };

    ws.onmessage = function(event) {
      console.log('Received message from server:', event.data);
      if(event.data.includes('open:') || event.data.includes('close:') || event.data.includes('update'))
        callback && callback()
    };

    ws.onclose = function(event) {
      console.log('Connection closed');
      if(timer)
          clearTimeout(timer)
      // 重连逻辑
      timer = setTimeout(() => initWebSocket(callback));
    };

    return ws
}

export const useCreateWebSocket = (callback: any) => {
  useEffect(() => {
    const ws = initWebSocket(callback)    

    return () => {
      ws.close();
    };
  }, [callback]);
}