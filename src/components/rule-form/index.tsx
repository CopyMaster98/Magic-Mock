import {
  Button,
  Form,
  FormProps,
  Input,
  InputNumber,
  Select,
  Space,
  Tooltip,
} from "antd";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  MinusCircleOutlined,
  SyncOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";
import "./index.css";
import { methodOptions } from "../../constant";

const RuleForm: React.FC<any> = forwardRef((props, ref) => {
  const { data, isUpdate } = props;

  const [form] = Form.useForm();
  const [requestHeaderInputType, setRequestHeaderInputType] = useState(true);
  const [responseDataInputType, setResponseDataInputType] = useState(true);
  const [payloadStatus, setPayloadStatus] = useState(false);

  const onFinish: FormProps["onFinish"] = (values) => {
    console.log("Success:", values);
  };
  const onFinishFailed: FormProps["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    form.resetFields();
  });
  useImperativeHandle(ref, () => ({
    onValidate: form.validateFields,
    onJSONEditorValidate: responseDataEditor?.validate(),
    onReset: () => {
      form.setFieldsValue({
        ruleName: "",
        rulePattern: "",
        ruleMethod: [],
        payloadJSON: null,
        requestHeader: [],
        requestHeaderJSON: null,
        responseData: [],
        responseDataJSON: null,
      });

      setPayloadEditor(null);
      setRequestHeaderEditor(null);
      setResponseDataEditor(null);
      payloadEditorValueRef.current = null;
      requestHeaderInputValueRef.current = null;
      responseDataInputValueRef.current = null;
      setPayloadStatus(false);
    },
    onInit: form.resetFields,
    requestHeaderInputType,
    responseDataInputType,
  }));

  const [responseDataEditor, setResponseDataEditor] = useState<any>();
  const [requestHeaderEditor, setRequestHeaderEditor] = useState<any>();
  const [payloadEditor, setPayloadEditor] = useState<any>();
  const isInitialRenderRef = useRef(true);
  const requestHeaderEditorRef = useRef<HTMLDivElement>(null);
  const responseDataEditorRef = useRef<HTMLDivElement>(null);
  const payloadEditorRef = useRef<HTMLDivElement>(null);
  const requestHeaderEditorValueRef = useRef(null);
  const responseDataEditorValueRef = useRef(null);
  const payloadEditorValueRef = useRef(null);
  const requestHeaderInputValueRef = useRef(null);
  const responseDataInputValueRef = useRef(null);
  const formBaseValueRef = useRef({
    ruleName: "",
    rulePattern: "",
    ruleMethod: [],
    responseStatusCode: null,
  });

  const handleInitRequestHeaderEditor = useCallback(() => {
    if (requestHeaderEditor && requestHeaderEditorValueRef.current) {
      requestHeaderEditor.setTextSelection(requestHeaderEditorValueRef.current);
      return;
    } else if (!requestHeaderEditor)
      !requestHeaderInputType &&
        requestHeaderEditorRef.current &&
        setRequestHeaderEditor(
          new JSONEditor(
            requestHeaderEditorRef.current,
            { mode: "code" },
            requestHeaderEditorValueRef.current
          )
        );
  }, [requestHeaderEditor, requestHeaderInputType]);

  const handleInitPayloadEditor = useCallback(() => {
    setPayloadStatus(
      data?.payloadJSON && Object.keys(data.payloadJSON).length > 0
    );
    if (payloadEditor && payloadEditorValueRef.current) {
      payloadEditor.setTextSelection(payloadEditorValueRef.current);
      return;
    } else if (!payloadEditor)
      payloadEditorRef.current &&
        setPayloadEditor(
          new JSONEditor(
            payloadEditorRef.current,
            { mode: "code" },
            payloadEditorValueRef.current
          )
        );
  }, [payloadEditor]);

  const handleInitResponseDataEditor = useCallback(() => {
    /**
     * 第二个参数可以添加各种配置
     * 比如mode： text | tree | view
     * 文本模式 树模式 预览模式
     */
    if (responseDataEditor && responseDataEditorValueRef.current) {
      responseDataEditor.setTextSelection(responseDataEditorValueRef.current);
      return;
    } else if (!responseDataEditor) {
      !responseDataInputType &&
        responseDataEditorRef.current &&
        setResponseDataEditor(
          new JSONEditor(
            responseDataEditorRef.current,
            { mode: "code" },
            responseDataEditorValueRef.current
          )
        );
    }
  }, [responseDataEditor, responseDataInputType]);

  useEffect(() => {
    handleInitRequestHeaderEditor();

    return () => {
      // 记得一定要注销
      if (requestHeaderEditor) {
        requestHeaderEditor.destroy();
        setRequestHeaderEditor(null);
      }
    };
  }, [data, form, handleInitRequestHeaderEditor, requestHeaderEditor]);

  useEffect(() => {
    handleInitPayloadEditor();

    return () => {
      if (payloadEditor) {
        payloadEditor.destroy();
        setPayloadEditor(null);
      }
    };
  }, [data, form, handleInitPayloadEditor, payloadEditor]);

  useEffect(() => {
    handleInitResponseDataEditor();

    return () => {
      if (responseDataEditor) {
        responseDataEditor.destroy();
        setResponseDataEditor(null);
      }
    };
  }, [data, form, handleInitResponseDataEditor, responseDataEditor]);

  const handleUpdateForm = useCallback(
    (type: "request" | "response") => {
      formBaseValueRef.current = {
        ruleName: form.getFieldValue("ruleName"),
        rulePattern: form.getFieldValue("rulePattern"),
        ruleMethod: form.getFieldValue("ruleMethod"),
        responseStatusCode: form.getFieldValue("responseStatusCode"),
      };

      const requestHeader = form.getFieldValue("requestHeader");
      const responseData = form.getFieldValue("responseData");

      if (requestHeader) requestHeaderInputValueRef.current = requestHeader;
      if (responseData) responseDataInputValueRef.current = responseData;

      if (type === "request") {
        setRequestHeaderInputType((oldValue) => !oldValue);
      } else {
        setResponseDataInputType((oldValue) => !oldValue);
      }
    },
    [form]
  );

  const requestHeaderSwap = useCallback(() => {
    handleUpdateForm("request");
  }, [handleUpdateForm]);

  const responseDataSwap = useCallback(() => {
    handleUpdateForm("response");
  }, [handleUpdateForm]);

  useEffect(() => {
    if (data && isInitialRenderRef.current) {
      setRequestHeaderInputType(data?.requestHeaderType === "text");
      setResponseDataInputType(data?.responseDataType === "text");
      requestHeaderEditorValueRef.current = data.requestHeaderJSON;
      responseDataEditorValueRef.current = data.responseDataJSON;
      payloadEditorValueRef.current = data.payloadJSON;
      formBaseValueRef.current = {
        ruleName: data.ruleName,
        rulePattern: data.rulePattern,
        ruleMethod: data.ruleMethod,
        responseStatusCode: data.responseStatusCode,
      };

      setTimeout(() => {
        Object.keys(formBaseValueRef.current).forEach((key) => {
          form.setFieldValue(
            key,
            formBaseValueRef.current[
              key as keyof typeof formBaseValueRef.current
            ]
          );
        });

        if (data.requestHeaderType === "text") {
          form.setFieldValue("requestHeader", data.requestHeader ?? []);
        } else {
          form.setFieldValue("requestHeaderJSON", data.requestHeaderJSON);
          // handleInitRequestHeaderEditor()
        }

        if (data?.responseDataType === "text") {
          form.setFieldValue("responseData", data.responseData ?? []);
        } else {
          form.setFieldValue("responseDataJSON", data.responseDataJSON);
          // handleInitResponseDataEditor()
        }

        form.setFieldValue("payloadJSON", data.payloadJSON);
      });

      isInitialRenderRef.current = false;
    }
  }, [data, form]);

  useEffect(() => {
    if (isInitialRenderRef.current && isUpdate) return;
    const { ruleName, rulePattern, ruleMethod, responseStatusCode } =
      formBaseValueRef.current;

    const baseFormItem = {
      ruleName,
      rulePattern,
      ruleMethod,
      responseStatusCode,
    };

    setTimeout(() => {
      Object.keys(baseFormItem).forEach((key) => {
        form.setFieldValue(key, baseFormItem[key as keyof typeof baseFormItem]);
      });
    });
    if (requestHeaderInputType)
      setTimeout(() =>
        form.setFieldValue("requestHeader", requestHeaderInputValueRef.current)
      );

    if (responseDataInputType)
      setTimeout(() =>
        form.setFieldValue("responseData", responseDataInputValueRef.current)
      );
  }, [form, isUpdate, requestHeaderInputType, responseDataInputType]);

  return (
    <Form
      name="basic"
      form={form}
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 18 }}
      initialValues={data}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      style={{
        position: "relative",
      }}
    >
      <Form.Item
        label="Rule Name"
        name="ruleName"
        rules={[{ required: true, message: "Please input your rule name!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Rule Pattern" style={{ marginBottom: 0 }} required>
        <Form.Item
          name="rulePattern"
          rules={[
            { required: true, message: "Please input your rule pattern!" },
          ]}
        >
          <Input />
        </Form.Item>
        <Tooltip title="Wildcards ('*' -> zero or more, '?' -> exactly one) are allowed. Escape character is backslash. Omitting is equivalent to '*'.">
          <InfoCircleOutlined
            style={{
              position: "absolute",
              transform: "translate(200%, -50%)",
              top: "30%",
              right: 0,
              color: "#faad14",
            }}
          />
        </Tooltip>
      </Form.Item>
      <Form.Item label="Rule Method" name="ruleMethod">
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Please select"
          options={methodOptions}
        />
      </Form.Item>
      <Form.Item label="Request Payload">
        <Form.Item
          name="payloadJSON"
          style={{
            display: "none",
          }}
        >
          <Input.TextArea
            placeholder="Enter payload JSON"
            autoSize={{ minRows: 5 }}
          />
        </Form.Item>

        <div
          style={{
            display:
              (payloadEditorValueRef.current &&
                Object.keys(payloadEditorValueRef.current).length > 0) ||
              payloadStatus
                ? "block"
                : "none",
          }}
          ref={payloadEditorRef}
          className={isUpdate ? "payload json-editor" : "json-editor"}
          onBlur={async (e) => {
            payloadEditor?.repair();

            const errors = await payloadEditor?.validate();

            if (errors.length) return;
            let value = null;

            try {
              value = payloadEditor.get();
            } catch (error) {}

            form.setFieldValue("payloadJSON", value);
            payloadEditorValueRef.current = value;
          }}
        ></div>

        <Button
          type="dashed"
          style={{
            display: payloadStatus ? "none" : "block",
          }}
          onClick={() => setPayloadStatus(true)}
          block
        >
          + Add Request Payload
        </Button>
      </Form.Item>
      {requestHeaderInputType ? (
        <Form.Item label="Request Header">
          <Form.List name={["requestHeader"]}>
            {(subFields, { add, remove }, { errors }) => (
              <div
              // style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
              >
                {subFields.map((subField) => (
                  // <Space key={subField.key} style={{ width: "100%" }}>
                  <div
                    key={subField.key}
                    style={{
                      display: "flex",
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Form.Item
                      name={[subField.name, "key"]}
                      style={{ width: "45%" }}
                      rules={[
                        {
                          required: true,
                          message: "Please input your header key!",
                        },
                      ]}
                    >
                      <Input placeholder="Header Key" />
                    </Form.Item>
                    <SyncOutlined style={{ transform: "translateY(-80%)" }} />
                    <Form.Item
                      name={[subField.name, "value"]}
                      style={{ width: "45%" }}
                    >
                      <Input placeholder="New Header Value" />
                    </Form.Item>
                    <MinusCircleOutlined
                      style={{ transform: "translateY(-80%)" }}
                      onClick={() => {
                        remove(subField.name);
                      }}
                    />
                  </div>
                ))}
                <SwapOutlined
                  style={{
                    position: "absolute",
                    transform: "translate(200%, 0)",
                    top: "10px",
                    right: 0,
                    cursor: "pointer",
                  }}
                  onClick={requestHeaderSwap}
                />
                <Button type="dashed" onClick={() => add()} block>
                  + Add Request Header
                </Button>
                {/* <Form.ErrorList errors={errors} /> */}
              </div>
            )}
          </Form.List>
        </Form.Item>
      ) : (
        <Form.Item label="Request Header JSON">
          <Form.Item
            name="requestHeaderJSON"
            style={{
              display: "none",
            }}
          >
            <Input.TextArea
              placeholder="Enter Request Header JSON"
              autoSize={{ minRows: 5 }}
            />
          </Form.Item>
          <div
            ref={requestHeaderEditorRef}
            className={isUpdate ? "update json-editor" : "json-editor"}
            onBlur={async (e) => {
              requestHeaderEditor?.repair();

              const errors = await requestHeaderEditor?.validate();

              if (errors.length) return;

              form.setFieldValue(
                "requestHeaderJSON",
                requestHeaderEditor.get()
              );
              requestHeaderEditorValueRef.current = requestHeaderEditor.get();
            }}
          ></div>
          <SwapOutlined
            style={{
              position: "absolute",
              transform: "translate(200%, 0)",
              top: "10px",
              right: 0,
              cursor: "pointer",
            }}
            onClick={requestHeaderSwap}
          />
        </Form.Item>
      )}
      <Form.Item label="Response StatusCode" name="responseStatusCode">
        <InputNumber
          min={100}
          max={599}
          controls={false}
          style={{ width: "100%" }}
          placeholder="Default value is the original status code"
        />
      </Form.Item>
      {responseDataInputType ? (
        <Form.Item label="Response Data">
          <Form.List name={["responseData"]}>
            {(subFields, { add, remove }, { errors }) => (
              <div
              // style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
              >
                {subFields.map((subField) => (
                  // <Space key={subField.key} style={{ width: "100%" }}>
                  <div
                    key={subField.key}
                    style={{
                      display: "flex",
                      flex: 1,
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <Form.Item
                      name={[subField.name, "key"]}
                      style={{ width: "45%" }}
                      rules={[
                        {
                          required: true,
                          message: "Please input your data key!",
                        },
                      ]}
                    >
                      <Input placeholder="Data Key" />
                    </Form.Item>
                    <SyncOutlined style={{ transform: "translateY(70%)" }} />
                    <Form.Item
                      name={[subField.name, "value"]}
                      style={{ width: "45%" }}
                    >
                      <Input placeholder="New Data Value" />
                    </Form.Item>
                    <MinusCircleOutlined
                      style={{ transform: "translateY(70%)" }}
                      onClick={() => {
                        remove(subField.name);
                      }}
                    />
                  </div>
                ))}
                <SwapOutlined
                  style={{
                    position: "absolute",
                    transform: "translate(200%, 0)",
                    top: "10px",
                    right: 0,
                    cursor: "pointer",
                  }}
                  onClick={responseDataSwap}
                />
                <Button type="dashed" onClick={() => add()} block>
                  + Add Response Data
                </Button>
                {/* <Form.ErrorList errors={errors} /> */}
              </div>
            )}
          </Form.List>
        </Form.Item>
      ) : (
        <Form.Item label="Response Data JSON">
          <Form.Item
            name="responseDataJSON"
            style={{
              display: "none",
            }}
          >
            <Input.TextArea
              placeholder="Enter Response Data JSON"
              autoSize={{ minRows: 5 }}
            />
          </Form.Item>
          <div
            ref={responseDataEditorRef}
            className={isUpdate ? "update json-editor" : "json-editor"}
            onBlur={async (e) => {
              responseDataEditor?.repair();

              const errors = await responseDataEditor?.validate();

              if (errors.length) return;

              form.setFieldValue("responseDataJSON", responseDataEditor.get());
              responseDataEditorValueRef.current = responseDataEditor.get();
            }}
          ></div>
          <SwapOutlined
            style={{
              position: "absolute",
              transform: "translate(200%, 0)",
              top: "10px",
              right: 0,
              cursor: "pointer",
            }}
            onClick={responseDataSwap}
          />
        </Form.Item>
      )}
    </Form>
  );
});

export default RuleForm;
