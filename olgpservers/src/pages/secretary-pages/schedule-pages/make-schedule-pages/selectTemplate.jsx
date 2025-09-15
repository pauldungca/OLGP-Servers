// SelectTemplate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  listTemplates,
  deleteTemplate,
} from "../../../../assets/scripts/template"; // fetch from template.js

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/selectTemplate.css";

export default function SelectTemplate() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await listTemplates();
        setTemplates(Array.isArray(rows) ? rows : []);
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Failed to load templates",
          text: err?.message || "Something went wrong.",
          confirmButtonText: "OK",
        });
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDoubleClick = (tpl) => {
    navigate("/useTemplate", {
      state: { id: tpl.id, templateName: tpl["template-name"] },
    });
  };

  const handleCreateTemplate = () => {
    navigate("/createTemplate");
  };

  const navigateToEditTemplate = (tpl) => {
    navigate("/editTemplate", {
      state: { templateID: tpl.templateID, templateName: tpl["template-name"] },
    });
  };

  const handleDelete = async (tpl) => {
    const ok = await deleteTemplate(tpl.templateID, tpl["template-name"]);
    if (ok) {
      setTemplates((prev) =>
        prev.filter((t) => t.templateID !== tpl.templateID)
      );
    }
  };

  return (
    <div className="schedule-page-container d-flex flex-column">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
          <div className="header-line"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="schedule-content container flex-grow-1">
        {loading ? (
          <div className="text-center text-muted my-5">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="text-center text-muted my-5">
            <div className="mb-3">
              <img
                src={image.OLGPlogo}
                alt="OLGP"
                width={80}
                height={80}
                style={{ opacity: 0.7 }}
              />
            </div>
            <div className="fw-semibold">No templates yet</div>
            <div className="small">
              Click “Create Mass Schedule Template” to add one.
            </div>
          </div>
        ) : (
          <div className="row">
            {templates.map((tpl) => (
              <div key={tpl.id} className="col-md-4 mb-4">
                <div
                  className="template-card clickable"
                  onDoubleClick={() => handleDoubleClick(tpl)}
                  title="Double-click to use this template"
                >
                  <div className="template-header">
                    <span
                      className="template-title"
                      title={tpl["template-name"]}
                    >
                      {tpl["template-name"]}
                    </span>
                    <div className="template-icons">
                      <i
                        className="bi bi-pencil-square edit-icon"
                        title="Edit template"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToEditTemplate(tpl);
                        }}
                      ></i>
                      <i
                        className="bi bi-trash delete-icon"
                        title="Delete template"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tpl);
                        }}
                      ></i>
                    </div>
                  </div>
                  <div className="template-body">
                    <img
                      src={image.OLGPlogo}
                      alt={tpl["template-name"]}
                      className="template-image"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Always Bottom Button */}
      <div className="create-btn-container">
        <button
          className="btn btn-primary create-btn"
          onClick={handleCreateTemplate}
        >
          <i className="bi bi-plus-circle"></i> Create Mass Schedule Template
        </button>
      </div>

      <Footer />
    </div>
  );
}
