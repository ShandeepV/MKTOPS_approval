import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  AutoComplete,
  Select,
  Radio,
  Card,
  Row,
  Col,
  message,
} from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInstance";
import { Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
const { TextArea } = Input;
const { Option } = Select;

const projectTypeOptions = [
  { value: "CNBL" },
  { value: "PNBL" },
  { value: "KT & Investment" },
];
const offshoreProjectTypeOptions = [
  ...projectTypeOptions,
  { value: "ELT(cost holiday)" },
];

const resourceTypeOptions = {
  "On-Shore": ["FTE", "Consultant"],
  "Off-Shore": ["New Hire", "Redeployment", "ELT", "Contractor"],
};
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const attachmentMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

// Loosely validates a single email address (mirrors the backend's check).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddRequest = () => {
  const [form] = Form.useForm();
  const [days, setDays] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [resourceLocation, setResourceLocation] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  let navigate = useNavigate();

  // Where "Cancel" / a successful submit should send the user back to —
  // admins go to the full NBL Approval list, everyone else goes to their own
  // "My Requests" page (which is all they're allowed to see).
  const loggedInUser = JSON.parse(
    localStorage.getItem("user_info") || "null",
  );
  const goBackPath = ["admin", "super_admin"].includes(loggedInUser?.role)
    ? "/requests"
    : "/my-requests";

  useEffect(() => {
    axiosInstance
      .get("/get-clients")
      .then((response) => {
        setClientOptions(
          (response.data?.data || []).map((client) => ({ value: client.name })),
        );
      })
      .catch(() => message.error("Failed to load client names"));
  }, []);

  const calculateDays = () => {
    const start = form.getFieldValue("startDate");
    const end = form.getFieldValue("endDate");

    if (start && end) {
      const diff = dayjs(end).diff(dayjs(start), "day") + 1;
      setDays(diff > 0 ? diff : 0);
    }
  };

  // When Resource Location changes, the Resource Type list changes to match it.
  const handleResourceLocationChange = (e) => {
    const value = e.target.value;
    setResourceLocation(value);
    form.setFieldsValue({
      resource_type: undefined,
      project_type: undefined,
    });
  };

  // Validate entered notification emails.
  const validateNotifyEmails = (_, value) => {
    const parts = (Array.isArray(value) ? value : String(value || "").split(/[;,]/))
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const invalid = parts.filter((e) => !EMAIL_PATTERN.test(e));
    if (invalid.length > 0) {
      return Promise.reject(
        new Error(`Invalid email(s): ${invalid.join(", ")}`),
      );
    }
    return Promise.resolve();
  };

  const validateAttachment = (file) => {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (file.size > MAX_ATTACHMENT_BYTES) {
      message.error("Attachment must be 2 MB or smaller");
      return Upload.LIST_IGNORE;
    }
    if (attachmentMimeTypes[extension] !== file.type) {
      message.error("Attach an image or PDF file");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onFinish = async (values) => {
    setBtnLoading(true);
    try {
      const formData = new FormData();

      formData.append("emp_id", values.empId);
      formData.append("name", values.name);
      formData.append("current_client", values.current_client);
      formData.append("current_project", values.current_project);
      formData.append("proposed_client", values.proposed_client);
      formData.append("proposed_project", values.proposed_project);
      formData.append("project_type", values.project_type);
      formData.append("resource_type", values.resource_type);
      formData.append("start_date", values.startDate.format("YYYY-MM-DD"));
      formData.append("end_date", values.endDate.format("YYYY-MM-DD"));
      formData.append("no_of_days", days);
      formData.append("remarks", values.remarks || "");

      formData.append(
        "receiver_emails",
        Array.isArray(values.receiver_emails)
          ? values.receiver_emails.join(";")
          : values.receiver_emails || "",
      );

      // On-Shore / Off-Shore
      formData.append("resource_location", values.resource_location);

      // Attach the logged-in requestor's email for audit and notification replies.
      formData.append("requestor_email", loggedInUser?.email || "");
      formData.append("requestor_name", loggedInUser?.name || values.name);

      // ✅ file append
      if (fileList.length > 0) {
        formData.append("file", fileList[0].originFileObj);
      }

      const response = await axiosInstance.post("/create-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.emailSent === false) {
        message.warning("Request saved, but notification email could not be sent");
      } else {
        message.success("Request added and notification email sent");
      }
      navigate(goBackPath);
    } catch (error) {
      // Show the backend's actual error/validation message instead of a
      // generic string, so failures are diagnosable from the UI itself.
      console.log(error);
      const backendMessage = error.response?.data?.message;
      const isNetworkError = !error.response;
      message.error(
        isNetworkError
          ? "Could not reach the server. Check your connection/API URL."
          : backendMessage ||
              `Failed to create request (status ${error.response?.status})`,
      );
    } finally {
      setBtnLoading(false);
    }
  };

  const onReset = () => {
    form.resetFields();
    setDays(0);
    setResourceLocation(null);
  };

  return (
    <Card
      title={`NBL REQUEST FORM${resourceLocation ? ` (${resourceLocation.toUpperCase()})` : ""}`}
      style={{ maxWidth: 800, margin: "auto", borderRadius: 12 }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        onValuesChange={calculateDays}
      >
        {/* On-Shore / Off-Shore — mandatory, and comes first */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Resource Location"
              name="resource_location"
              rules={[
                { required: true, message: "Select On-Shore or Off-Shore" },
              ]}
            >
              <Radio.Group onChange={handleResourceLocationChange}>
                <Radio.Button value="On-Shore">On-Shore</Radio.Button>
                <Radio.Button value="Off-Shore">Off-Shore</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {/* Everything below is only usable once On-Shore / Off-Shore has
            been chosen above — until then there's nothing to fill in. */}
        {resourceLocation && (
          <>
            <Row gutter={16}>
              {/* Emp ID */}
              <Col span={12}>
                <Form.Item
                  label="GCID"
                  name="empId"
                  rules={[
                    { required: true, message: "ID is required" },
                    { max: 8, message: "Max 8 characters allowed" },
                  ]}
                >
                  <Input placeholder="Enter ID" maxLength={8} />
                </Form.Item>
              </Col>

              {/* Name */}
              <Col span={12}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Name is required" },
                    {
                      pattern: /^[A-Za-z ]+$/,
                      message: "Only alphabets allowed",
                    },
                  ]}
                >
                  <Input placeholder="Enter Name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {/* Project */}
              <Col span={12}>
                <Form.Item
                  label="Current Client Name"
                  name="current_client"
                  rules={[{ required: true, message: "Select current client" }]}
                >
                  <AutoComplete
                    options={clientOptions}
                    placeholder="Select or type client"
                    filterOption={(inputValue, option) =>
                      option.value
                        .toUpperCase()
                        .includes(inputValue.toUpperCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Current Project Name"
                  name="current_project"
                  rules={[
                    { required: true, message: "Current project is required" },
                  ]}
                >
                  <Input placeholder="Enter current project" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Proposed Client Name"
                  name="proposed_client"
                  rules={[{ required: true, message: "Select Proposed client" }]}
                >
                  <AutoComplete
                    options={clientOptions}
                    placeholder="Select or type client"
                    filterOption={(inputValue, option) =>
                      option.value
                        .toUpperCase()
                        .includes(inputValue.toUpperCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Proposed Project Name"
                  name="proposed_project"
                  rules={[
                    { required: true, message: "Proposed project is required" },
                  ]}
                >
                  <Input placeholder="Enter Proposed project" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Project Type"
                  name="project_type"
                  rules={[{ required: true, message: "Select Project Type" }]}
                >
                  <AutoComplete
                    options={
                      resourceLocation === "Off-Shore"
                        ? offshoreProjectTypeOptions
                        : projectTypeOptions
                    }
                    placeholder="Select project type"
                    filterOption={(inputValue, option) =>
                      option.value
                        .toUpperCase()
                        .includes(inputValue.toUpperCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Resource Type"
                  name="resource_type"
                  // Re-validated whenever Resource Location flips, so a stale
                  // Off-Shore value can't slip through after switching to
                  // On-Shore (or vice versa).
                  dependencies={["resource_location"]}
                  rules={[{ required: true, message: "Select Resource Type" }]}
                >
                  <Select placeholder="Select resource type" allowClear>
                    {(resourceTypeOptions[resourceLocation] || []).map((option) => (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {/* Start Date */}
              <Col span={12}>
                <Form.Item
                  label="Start Date"
                  name="startDate"
                  rules={[{ required: true, message: "Start date required" }]}
                >
                  <DatePicker style={{ width: "100%" }} format={"MM-DD-YYYY"} />
                </Form.Item>
              </Col>

              {/* End Date */}
              <Col span={12}>
                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[{ required: true, message: "End date required" }]}
                >
                  <DatePicker style={{ width: "100%" }} format={"MM-DD-YYYY"} />
                </Form.Item>
              </Col>
            </Row>

            {/* Days Display */}
            <Form.Item label="No. of Days">
              <Input value={days} readOnly />
            </Form.Item>

            {/* Remarks */}
            <Form.Item
              label="Remarks"
              name="remarks"
              rules={[{ required: true, whitespace: true, message: "Remarks are required" }]}
            >
              <TextArea rows={3} placeholder="Enter remarks" />
            </Form.Item>
            <Form.Item label="Attachment (Optional)">
              <Upload
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/avif,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff,.avif,.pdf"
                beforeUpload={validateAttachment}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label="EMAIL TO BE CC'd"
              name="receiver_emails"
              required={resourceLocation === "On-Shore"}
              rules={[
                {
                  required: resourceLocation === "On-Shore",
                  message: "Enter at least one email address",
                },
                { validator: validateNotifyEmails },
              ]}
            >
              <Select
                mode="tags"
                tokenSeparators={[";", ","]}
                placeholder="Type an email address and press Enter"
                maxTagCount="responsive"
                allowClear
              />
            </Form.Item>
          </>
        )}

        {/* Buttons — Cancel always available so the user isn't stuck;
            Submit will simply fail required-field validation (including
            Resource Location itself) if nothing's been filled in yet. */}
        <Row justify="end" gutter={10}>
          <Col>
            <Button onClick={onReset}>Reset</Button>
          </Col>
          <Col>
            <Button danger onClick={() => navigate(goBackPath)}>
              Cancel
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              loading={btnLoading}
              disabled={!resourceLocation}
            >
              Submit
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AddRequest;