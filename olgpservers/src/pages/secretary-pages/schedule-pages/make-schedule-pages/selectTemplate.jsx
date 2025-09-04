import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/selectTemplate.css";

export default function SelectTemplate() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  // Template Data (can come from props, API, etc.)
  const navigate = useNavigate();

  const templates = [
    {
      id: 1,
      title: "Christening Mass dfgdfg df gdf gdf gdf g dfg dfg ",
      image: image.OLGPlogo,
    },
    { id: 2, title: "Wedding Mass", image: image.OLGPlogo },
    { id: 3, title: "Funeral Mass", image: image.OLGPlogo },
    { id: 4, title: "Sunday Mass", image: image.OLGPlogo },
  ];

  const handleDoubleClick = () => {
    navigate("/useTemplate");
  };

  const handleCreateTemplate = () => {
    navigate("/createTemplate");
  };

  const navigateToEditTemplate = () => {
    navigate("/editTemplate");
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
        <div className="row">
          {templates.map((template) => (
            <div key={template.id} className="col-md-4 mb-4">
              <div
                className="template-card clickable"
                onDoubleClick={() => handleDoubleClick(template.title)}
              >
                <div className="template-header">
                  <span className="template-title">{template.title}</span>
                  <div className="template-icons">
                    <i
                      className="bi bi-pencil-square edit-icon"
                      onClick={navigateToEditTemplate}
                    ></i>
                    <i className="bi bi-trash delete-icon"></i>
                  </div>
                </div>
                <div className="template-body">
                  <img
                    src={template.image}
                    alt={template.title}
                    className="template-image"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
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
