app.post(
  "/compare-faces",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 }
  ]),
  async (req, res) => {
    console.log("ROUTE /compare-faces HIT");

    try {
      const apiKey = process.env.FACEPP_API_KEY;
      const apiSecret = process.env.FACEPP_API_SECRET;

      const file1 = req.files["image1"]?.[0];
      const file2 = req.files["image2"]?.[0];

      if (!file1 || !file2) {
        return res.status(400).json({
          error: "Both images are required"
        });
      }

      const imageBase64_1 = file1.buffer.toString("base64");
      const imageBase64_2 = file2.buffer.toString("base64");

      const formData = new URLSearchParams();
      formData.append("api_key", apiKey);
      formData.append("api_secret", apiSecret);
      formData.append("image_base64_1", imageBase64_1);
      formData.append("image_base64_2", imageBase64_2);

      const response = await axios.post(
        "https://api-us.faceplusplus.com/facepp/v3/compare",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      console.log("COMPARE RESPONSE:", response.data);

      res.json(response.data);

    } catch (error) {
      console.log("COMPARE ERROR:");
      console.log(error.response?.data || error.message);

      res.status(500).json({
        error: "Face comparison failed",
        details: error.response?.data || error.message
      });
    }
  }
);