import React, { useState, useEffect } from "react";
import { Table, Button } from "antd";

const CustomTable = ({ data, loading, onViewDetails }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: isMobile ? 100 : 150,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: isMobile ? 150 : 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Role",
      dataIndex: "role",
      width: isMobile ? 100 : 120,
      filters: [
        { text: "Flexible", value: "Flexible" },
        { text: "Non-Flexible", value: "Non-Flexible" },
      ],
      onFilter: (value, record) => record.role === value,
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "Action",
      width: isMobile ? 100 : 150,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: isMobile ? "90px" : "120px",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
          onClick={() => onViewDetails(record)}
        >
          {isMobile ? "View" : "View Details"}
        </Button>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          showTotal: !isMobile
            ? (total) => `Total ${total} members`
            : undefined,
          responsive: true,
        }}
        scroll={{
          x: isMobile ? 500 : 600,
          y: isMobile ? 300 : 400,
        }}
        bordered
        showSorterTooltip
        size={isMobile ? "small" : "middle"}
        style={{
          minWidth: isMobile ? "500px" : "600px",
          width: "100%",
        }}
      />
    </div>
  );
};

const ImportMemberTable = ({ data, loading, onViewDetails }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: isMobile ? 100 : 150,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: isMobile ? 150 : 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Action",
      width: isMobile ? 100 : 150,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: isMobile ? "90px" : "120px",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
          onClick={() => onViewDetails(record)}
        >
          Import
        </Button>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          responsive: true,
        }}
        scroll={{
          x: isMobile ? 400 : 600,
          y: isMobile ? 300 : 400,
        }}
        bordered
        showSorterTooltip
        size={isMobile ? "small" : "middle"}
        style={{
          minWidth: isMobile ? "400px" : "600px",
          width: "100%",
        }}
      />
    </div>
  );
};

const AssignMemberTable = ({ data, loading, onViewDetails }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: isMobile ? 100 : 150,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: isMobile ? 150 : 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Action",
      width: isMobile ? 100 : 150,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: isMobile ? "90px" : "120px",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
          onClick={() => onViewDetails(record)}
        >
          Assign
        </Button>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          responsive: true,
        }}
        scroll={{
          x: isMobile ? 400 : 600,
          y: isMobile ? 300 : 400,
        }}
        bordered
        showSorterTooltip
        size={isMobile ? "small" : "middle"}
        style={{
          minWidth: isMobile ? "400px" : "600px",
          width: "100%",
        }}
      />
    </div>
  );
};

const GroupTable = ({ data, loading, onViewDetails }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: isMobile ? 90 : 150,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: isMobile ? 130 : 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Group",
      dataIndex: "group",
      width: isMobile ? 80 : 120,
      ellipsis: true,
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "Action",
      width: isMobile ? 100 : 150,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: isMobile ? "90px" : "120px",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
          onClick={() => onViewDetails(record)}
        >
          {isMobile ? "View" : "View Details"}
        </Button>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          responsive: true,
        }}
        scroll={{
          x: isMobile ? 500 : 600,
          y: isMobile ? 300 : 400,
        }}
        bordered
        showSorterTooltip
        size={isMobile ? "small" : "middle"}
        style={{
          minWidth: isMobile ? "500px" : "600px",
          width: "100%",
        }}
      />
    </div>
  );
};

export { CustomTable, ImportMemberTable, AssignMemberTable, GroupTable };
