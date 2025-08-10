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
      title: "Status",
      dataIndex: "status",
      showSorterTooltip: { target: "full-header" },
      filters: [
        {
          text: "Apprentice",
          value: "Apprentice",
        },
        {
          text: "Certified",
          value: "Certified",
        },
      ],
      width: 100,
      onFilter: (value, record) => record.status.indexOf(value) === 0,
      sorter: (a, b) => a.status.length - b.status.length,
      sortDirections: ["descend"],
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

export { CustomTable, ImportMemberTable, AssignMemberTable };
