import path from "path";
import fs from "fs";
import multer from "multer";
import express from "express";
import nodemailer from "nodemailer";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;
const EMAIL = process.env.USER_EMAIL;
const PASSWORD = process.env.USER_PASSWORD;

// Serve static files from 'public' folder
app.use(express.static("public"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Store uploaded files temporarily in 'uploads/' folder
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/send-email", upload.array("attachments"), async (req, res) => {
  const files = req.files;
  const { email, name, message } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email not provided" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });

    const mailOptions = {
      from: email,
      to: email,
      subject: `New Message from ${name}`,
      html: `
             <div style="font-family: Arial, sans-serif; line-height: 1.5; padding: 10px;">
                <h2 style="color: #007BFF;">New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong><br/>${message}</p>
            </div>
            `,
      attachments: files.map((file) => ({
        filename: file.originalname,
        path: file.path,
      })),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);

    // ✅ Now it's safe to delete files
    files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file ${file.path}`, err);
      });
    });

    res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on port 3000");
});
