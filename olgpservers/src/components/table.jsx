import React from "react";
import { Table, Button } from "antd";

const CustomTable = ({ data, loading, onViewDetails }) => {
  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
    },
    {
      title: "Role",
      dataIndex: "role",
      width: 120,
      filters: [
        { text: "Flexible", value: "Flexible" },
        { text: "Non-Flexible", value: "Non-Flexible" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Action",
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: "120px",
          }}
          onClick={() => onViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ y: 400 }}
        bordered
        showSorterTooltip
        style={{
          minWidth: "600px",
          width: "auto",
        }}
      />
    </div>
  );
};

const ImportMemberTable = ({ data, loading, onViewDetails }) => {
  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
    },
    {
      title: "Action",
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: "120px",
          }}
          onClick={() => onViewDetails(record)}
        >
          Import Member
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ y: 400 }}
        bordered
        showSorterTooltip
        style={{
          minWidth: "600px",
          width: "auto",
        }}
      />
    </div>
  );
};

const AssignMemberTable = ({ data, loading, onViewDetails }) => {
  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
    },
    {
      title: "Action",
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: "120px",
          }}
          onClick={() => onViewDetails(record)}
        >
          Assign
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ y: 400 }}
        bordered
        showSorterTooltip
        style={{
          minWidth: "600px",
          width: "auto",
        }}
      />
    </div>
  );
};

const GroupTable = ({ data, loading, onViewDetails }) => {
  const columns = [
    {
      title: "Member ID",
      dataIndex: "idNumber",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Name",
      dataIndex: "firstName",
      width: 200,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      ellipsis: true,
    },
    {
      title: "Group",
      dataIndex: "group",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Action",
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          style={{
            backgroundColor: "#4169E1",
            borderColor: "#4169E1",
            width: "120px",
          }}
          onClick={() => onViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ y: 400 }}
        bordered
        showSorterTooltip
        style={{
          minWidth: "600px",
          width: "auto",
        }}
      />
    </div>
  );
};

export { CustomTable, ImportMemberTable, AssignMemberTable, GroupTable };
