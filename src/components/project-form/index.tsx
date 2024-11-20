import { Form, FormProps, Input } from "antd";
import { forwardRef, useEffect, useImperativeHandle } from "react";

const AddProjectForm: React.FC<any> = forwardRef((props, ref) => {
  const { data, type = "add" } = props;
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
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={data}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="Project Name"
        name="projectName"
        rules={[{ required: true, message: "Please input your project name!" }]}
      >
        <Input />
      </Form.Item>

      {type === "add" && (
        <Form.Item
          label="Project Url"
          name="projectUrl"
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
        </Form.Item>
      )}
    </Form>
  );
});

export default AddProjectForm;
