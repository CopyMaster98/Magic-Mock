import { Form, FormProps, Input } from "antd";
import { forwardRef, useImperativeHandle } from "react";

const AddProjectForm: React.FC<any> = forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const onFinish: FormProps["onFinish"] = (values) => {
    console.log('Success:', values);
  };
  
  const onFinishFailed: FormProps["onFinishFailed"] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  useImperativeHandle(ref, () => ({
    onValidate: form.validateFields,
    onReset: form.resetFields
  }));

  return <Form
    name="basic"
    form={form}
    labelCol={{ span: 8 }}
    wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600 }}
    initialValues={{ remember: true }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item
      label="Project Name"
      name="projectName"
      rules={[{ required: true, message: 'Please input your project name!' }]}
    >
      <Input />
    </Form.Item>

    <Form.Item
      label="Project Url"
      name="projectUrl"
      rules={[{ required: false, message: 'Please input your project url!' }]}
    >
      <Input />
    </Form.Item>
    </Form>
})

export default AddProjectForm