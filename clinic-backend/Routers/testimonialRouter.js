const express = require("express");
const router = express.Router();
const { getAllTestimonials, createTestimonial } = require("../Controller/testimonialController");
const authMiddleware = require("../Middelware/authMiddleware");

router.get("/", getAllTestimonials);

router.post("/", authMiddleware, createTestimonial);

module.exports = router;
