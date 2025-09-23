import "../assets/styles/termsModal.css";

export default function TermsModal({ open, onAgree, onExit }) {
  if (!open) return null;

  return (
    <div className="tm-overlay">
      <div className="tm-box">
        <h2 className="tm-title">Terms and Conditions</h2>
        <div className="tm-content">
          <ul>
            <li>
              <strong>Account Usage:</strong> Each user is given a unique
              account to access OLGP Servers. Sharing accounts, impersonating
              others, or unauthorized access to another account is strictly
              prohibited.
            </li>
            <li>
              <strong>Personal Information:</strong> The system may store data
              such as your name, ID number, email, and schedule details. You are
              responsible for keeping this information accurate and updated.
            </li>
            <li>
              <strong>Uploaded Content:</strong> Any images or files uploaded
              (e.g., profile photos, documents) must be appropriate, related to
              parish service, and free from offensive or harmful content. OLGP
              Servers reserves the right to remove inappropriate uploads.
            </li>
            <li>
              <strong>Data Use:</strong> Information provided will only be used
              for scheduling, communication, and record-keeping within OLGP
              Servers. Data will not be sold or shared outside parish
              administration without consent.
            </li>
            <li>
              <strong>Data Security:</strong> Reasonable safeguards are applied
              to protect your information. However, complete security cannot be
              guaranteed against unauthorized access or technical failures.
            </li>
            <li>
              <strong>User Responsibility:</strong> You agree not to upload
              false data, disrupt schedules, or misuse the system in any way
              that may affect other users or parish operations.
            </li>
            <li>
              <strong>Consent:</strong> By clicking “Agree,” you acknowledge
              that you understand and accept these Terms regarding account use,
              data handling, and uploaded content. If you do not agree, click
              “Exit” to discontinue use of OLGP Servers.
            </li>
          </ul>
        </div>
        <div className="tm-actions">
          <button className="tm-btn tm-btn-exit" onClick={onExit}>
            Exit
          </button>
          <button className="tm-btn tm-btn-agree" onClick={onAgree}>
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}
