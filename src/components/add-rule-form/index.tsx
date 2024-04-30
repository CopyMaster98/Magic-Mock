import { Button, Form, FormProps, Input, Space } from "antd";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  MinusCircleOutlined,
  SyncOutlined,
  SwapOutlined,
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
      labelCol={{ span: 3 }}
      wrapperCol={{ span: 20 }}
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

      {/* <Form.Item
        label="Request"
        name="request"
        rules={[
          {
            required: true,
            validator: async (rule, value) => {
              const reg = /^(http|https):\/\/(\S+)$/;
              if (!reg.test(value)) {
                throw new Error("Please enter the correct url address!");
              }
            },
          },
        ]}
      >
        <Input />
      </Form.Item> */}
      <Form.Item label="RequestHeader">
        <Form.List name={["requestHeader"]}>
          {(subFields, { add, remove }, { errors }) => (
            <div
              style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
            >
              {subFields.map((subField) => (
                // <Space key={subField.key} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Form.Item
                    name={[subField.name, "headerKey"]}
                    style={{ width: "45%", margin: 0 }}
                    rules={[
                      {
                        required: true,
                        message: "Please input your header key!",
                      },
                    ]}
                  >
                    <Input placeholder="Header Key" />
                  </Form.Item>
                  <SyncOutlined />
                  <Form.Item
                    name={[subField.name, "newHeaderValue"]}
                    style={{ width: "45%", margin: 0 }}
                  >
                    <Input placeholder="New Header Value" />
                  </Form.Item>
                  <MinusCircleOutlined
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
                  top: "25%",
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
