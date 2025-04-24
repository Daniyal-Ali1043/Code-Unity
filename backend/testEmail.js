const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "codeunityfyp@gmail.com", // Your Gmail
    pass: "isro mtim sjsl lqrs",    // Your App Password
  },
});

const mailOptions = {
  from: "codeunityfyp@gmail.com",
  to: "Huzaifaawan0809@gmail.com", // Replace with recipient email
  subject: "Huzaifa Chomu",
  text: `Hi Huzaifa,

Yeh to suno, janab Rowaid to waise lagta hai jaise gym ki machines bhi kehti hon, "Yaar, thoda aaram do, hum bhi insaan hain!" 🤣  
Aur yeh konse protein shake peete ho, ke weight uthane ke baad bhi weight wapas neeche rakhne ka dil nahi karta? 😂  
Yaar, tumhari biceps itni bari hain ke unko dekh kar chhotay bachay kehte hain, "Mama, yeh konsa pahaar hai?" 😂  

Mazid jugton ke liye dobara email karo! 😜`,
};


transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error("Error sending email:", error);
  }
  console.log("Email sent:", info.response);
});
