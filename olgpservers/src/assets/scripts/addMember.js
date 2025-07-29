import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";

// Opens the hidden file input
export const handleInputImage = (ref) => {
  if (ref?.current) {
    ref.current.click();
  }
};

// Gets the selected file
export const handleFileChange = (e) => {
  const fileInput = e.target;
  const file = fileInput.files[0];

  fileInput.value = "";

  return file || null;
};

export const onFileChange = (e, setFileAttached) => {
  const file = handleFileChange(e);
  if (!file) return;

  if (!handleFileSize(file)) return;

  setFileAttached(true);
};

// Validates file size
export const handleFileSize = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (file.size > maxSize) {
    Swal.fire({
      icon: "error",
      title: "File Too Large",
      text: "The file size exceeds the 5MB limit. Please choose a smaller image.",
    });
    return false;
  }

  return true;
};

export const generateUserID = () => {
  const prefix = "2025";
  const suffix = Math.floor(1000 + Math.random() * 90000);
  return prefix + suffix;
};

export const formatContactNumber = (value) => {
  let digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly.length > 11) digitsOnly = digitsOnly.slice(0, 11);

  if (digitsOnly.length <= 4) {
    return digitsOnly;
  } else if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
  } else {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(
      4,
      7
    )} ${digitsOnly.slice(7)}`;
  }
};

function insertMemberInformation(
  idNumber,
  firstName,
  middleName,
  lastName,
  address,
  dateJoined,
  sex,
  email,
  contactNumber
) {
  return supabase
    .from("members-information")
    .insert([
      {
        idNumber,
        firstName,
        middleName,
        lastName,
        address,
        dateJoined,
        sex,
        email,
        contactNumber,
      },
    ])
    .then(({ data, error }) => {
      if (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
        throw new Error(error.message);
      } else {
        Swal.fire("Saved!", "", "success");
      }
      return data;
    })
    .catch((err) => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add member: " + err.message,
      });
      throw new Error("Failed to add member: " + err.message);
    });
}

export const addMember = (
  idNumber,
  firstName,
  middleName,
  lastName,
  address,
  dateJoined,
  sex,
  email,
  contactNumber
) => {
  const missingFields = [];

  if (!idNumber) missingFields.push("ID Number");
  if (!firstName) missingFields.push("First Name");
  if (!lastName) missingFields.push("Last Name");
  if (!address) missingFields.push("Address");
  if (!dateJoined) missingFields.push("Date Joined");
  if (!sex) missingFields.push("Sex");
  if (!email) missingFields.push("Email");
  if (!contactNumber) missingFields.push("Contact Number");

  if (missingFields.length > 0) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      html: `Please fill in the following required field(s):<br><strong>${missingFields.join(
        ", "
      )}</strong>`,
    });
    return false;
  } else {
    Swal.fire({
      icon: "question",
      title: "Are you sure to add this member?",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        insertMemberInformation(
          idNumber,
          firstName,
          middleName,
          lastName,
          address,
          dateJoined,
          sex,
          email,
          contactNumber
        );
        //Swal.fire("Saved!", "", "success");
      } else if (result.isDismissed) {
      }
    });
  }
};
