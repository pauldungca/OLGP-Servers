import axios from "axios";

export const fetchProvinces = async () => {
  try {
    const response = await axios.get("https://psgc.gitlab.io/api/provinces/");
    return response.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};

export const fetchMunicipalities = async (provinceCode) => {
  try {
    const response = await axios.get(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching municipalities:", error);
    return [];
  }
};

export const fetchBarangays = async (municipalityCode) => {
  try {
    const response = await axios.get(
      `https://psgc.gitlab.io/api/municipalities/${municipalityCode}/barangays/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching barangays:", error);
    return [];
  }
};
