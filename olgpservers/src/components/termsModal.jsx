// src/components/termsModal.jsx
import Swal from "sweetalert2";

export default function termsModal(onAgree, onExit) {
  Swal.fire({
    title: "<strong>Terms and Conditions</strong>",
    html: `
      <div style="max-height:300px; overflow-y:auto; text-align:left; padding-right:10px">
        <ul style="padding-left:18px; line-height:1.6">
          <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ullamcorper eget tortor in cursus.</li>
          <li>Etiam vel velit euismod, consequat tortor vitae, consequat orci.</li>
          <li>Phasellus mi arcu, tempus sed augue id, elementum placerat odio.</li>
          <li>Posuere cubilia curae; Suspendisse viverra orci a luctus laoreet.</li>
          <li>Sed tempus, neque et fringilla consectetur, velit ex tincidunt magna.</li>
          <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ullamcorper eget tortor in cursus.</li>
          <li>Etiam vel velit euismod, consequat tortor vitae, consequat orci.</li>
          <li>Phasellus mi arcu, tempus sed augue id, elementum placerat odio.</li>
          <li>Posuere cubilia curae; Suspendisse viverra orci a luctus laoreet.</li>
          <li>Sed tempus, neque et fringilla consectetur, velit ex tincidunt magna.</li>
        </ul>
      </div>
      <style>
        .swal2-actions {
          display: flex !important;
          justify-content: space-between !important;
          width: 100% !important;
          padding: 0 10px;
        }
        .swal2-confirm, .swal2-cancel {
          flex: 0 0 48% !important;   
          margin: 10px 0 !important;
          font-size: 16px !important;
          padding: 12px !important;
        }
      </style>
    `,
    showCancelButton: true,
    confirmButtonText: "Agree",
    cancelButtonText: "Exit",
    confirmButtonColor: "#4CAF50", // green
    cancelButtonColor: "#F44336", // red
    allowOutsideClick: false,
    allowEscapeKey: false,
    width: "600px",
    reverseButtons: true,
    customClass: {
      actions: "swal2-actions",
      confirmButton: "swal2-confirm",
      cancelButton: "swal2-cancel",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.setItem("agreedTerms", "true");
      if (onAgree) onAgree();
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      if (onExit) onExit();
    }
  });
}
