export const facultyEmailCodes = Object.freeze({
  Technology: "tec",
  "Applied Science": "as",
  "Social Science": "ssh",
  Management: "mgt",
  Agriculture: "agri",
  Medicine: "med",
});

export const createStudentEmail = (registrationNumber, faculty) => {
  if (typeof registrationNumber !== "string" || typeof faculty !== "string") return "";

  const username = registrationNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const facultyCode = facultyEmailCodes[faculty];

  return username && facultyCode ? `${username}@${facultyCode}.rjt.ac.lk` : "";
};

export const isStudentEmail = (email) =>
  typeof email === "string" &&
  /^[a-z0-9]+@(tec|as|ssh|mgt|agri|med)\.rjt\.ac\.lk$/i.test(email.trim());