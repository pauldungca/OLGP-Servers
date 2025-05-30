import emailjs from "@emailjs/browser";

emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

export default emailjs;
