import { Button, Form, FormProps, Input, Space, Tooltip } from "antd";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  MinusCircleOutlined,
  SyncOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const AddRuleForm: React.FC<any> = forwardRef((props, ref) => {
  const { data } = props;
  const [form] = Form.useForm();
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

  return (
    <Form
      name="basic"
      form={form}
      labelCol={{ span: 5 }}
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
              />
              <Button type="dashed" onClick={() => add()} block>
                + Add Sub Item
              </Button>
              {/* <Form.ErrorList errors={errors} /> */}
            </div>
          )}
        </Form.List>
      </Form.Item>

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
                  <SyncOutlined style={{ transform: "translateY(-80%)" }} />
                  <Form.Item
                    name={[subField.name, "newDataValue"]}
                    style={{ width: "45%" }}
                  >
                    <Input placeholder="New Data Value" />
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
                }}
              />
              <Button type="dashed" onClick={() => add()} block>
                + Add Sub Item
              </Button>
              {/* <Form.ErrorList errors={errors} /> */}
            </div>
          )}
        </Form.List>
      </Form.Item>
    </Form>
  );
});

export default AddRuleForm;
