import { Button, Form, FormProps, Input, Space, Tooltip } from "antd";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  MinusCircleOutlined,
  SyncOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const RuleForm: React.FC<any> = forwardRef((props, ref) => {
  const { data } = props;
  const [form] = Form.useForm();
  const [requestHeaderInputType, setRequestHeaderInputType] = useState(true);
  const [responseDataInputType, setResponseDataInputType] = useState(true);
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
    onReset: () =>
      form.setFieldsValue({
        projectName: "",
        projectUrl: "",
      }),
    onInit: form.resetFields,
  }));

  const [requestHeaderValue, setRequestHeaderValue] = useState({
    requestHeader: [],
    requestHeaderJSON: "",
  });

  const [responseDataValue, setResponseDataValue] = useState({
    responseData: [],
    responseDataJSON: "",
  });

  const handleUpdateForm = useCallback(
    (type: "request" | "response") => {
      const baseFormItem = {
        ruleName: form.getFieldValue("ruleName"),
        rulePattern: form.getFieldValue("rulePattern"),
        ruleMethod: form.getFieldValue("ruleMethod"),
      };

      setTimeout(() => {
        Object.keys(baseFormItem).forEach((key) => {
          form.setFieldValue(
            key,
            baseFormItem[key as keyof typeof baseFormItem]
          );
        });
      });

      if (type === "request") {
        const requestHeader = form.getFieldValue("requestHeader");
        const requestHeaderJSON = form.getFieldValue("requestHeaderJSON");
        const requestLabel = requestHeaderInputType
          ? "requestHeaderJSON"
          : "requestHeader";
        setTimeout(() =>
          form.setFieldValue(requestLabel, requestHeaderValue[requestLabel])
        );
        if (requestHeader)
          setRequestHeaderValue((oldValue) => ({
            ...oldValue,
            requestHeader: requestHeader,
          }));
        if (requestHeaderJSON)
          setRequestHeaderValue((oldValue) => ({
            ...oldValue,
            requestHeaderJSON: requestHeaderJSON,
          }));

        const responseLabel = responseDataInputType
          ? "responseData"
          : "responseDataJSON";

        const responseValue = form.getFieldValue(responseLabel);

        setTimeout(() => form.setFieldValue(responseLabel, responseValue));

        setRequestHeaderInputType((oldValue) => !oldValue);
      } else {
        const responseData = form.getFieldValue("responseData");
        const responseDataJSON = form.getFieldValue("responseDataJSON");
        const responseLabel = responseDataInputType
          ? "responseDataJSON"
          : "responseData";
        setTimeout(() =>
          form.setFieldValue(responseLabel, responseDataValue[responseLabel])
        );
        if (responseData)
          setResponseDataValue((oldValue) => ({
            ...oldValue,
            responseData: responseData,
          }));
        if (responseDataJSON)
          setResponseDataValue((oldValue) => ({
            ...oldValue,
            responseDataJSON: responseDataJSON,
          }));

        const requestLabel = requestHeaderInputType
          ? "requestHeader"
          : "requestHeaderJSON";

        const requestValue = form.getFieldValue(requestLabel);
        setTimeout(() => form.setFieldValue(requestLabel, requestValue));

        setResponseDataInputType((oldValue) => !oldValue);
      }
    },
    [
      form,
      requestHeaderInputType,
      requestHeaderValue,
      responseDataInputType,
      responseDataValue,
    ]
  );

  const requestHeaderSwap = useCallback(() => {
    handleUpdateForm("request");
  }, [handleUpdateForm]);

  const responseDataSwap = useCallback(() => {
    handleUpdateForm("response");
  }, [handleUpdateForm]);

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
        <Input />
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
                      name={[subField.name, "headerKey"]}
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
                      name={[subField.name, "newHeaderValue"]}
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
          <Form.Item name="requestHeaderJSON">
            <Input.TextArea
              placeholder="Enter Request Header JSON"
              autoSize={{ minRows: 5 }}
            />
          </Form.Item>
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
                      name={[subField.name, "dataKey"]}
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
                      name={[subField.name, "newDataValue"]}
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
          <Form.Item name="responseDataJSON">
            <Input.TextArea
              placeholder="Enter Response Data JSON"
              autoSize={{ minRows: 5 }}
            />
          </Form.Item>
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
