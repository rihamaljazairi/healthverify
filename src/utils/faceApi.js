export const compareFaces = async (image1, image2) => {
  const apiKey = "YOUR_KEY"
  const apiSecret = "YOUR_SECRET"

  if (!image1 || !image2) return null

  const formData = new FormData()
  formData.append("api_key", apiKey)
  formData.append("api_secret", apiSecret)
  formData.append("image_url1", image1)
  formData.append("image_url2", image2)

  try {
    const res = await fetch(
      "https://api-us.faceplusplus.com/facepp/v3/compare",
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await res.json()

    if (data.error_message) return null

    return data
  } catch (err) {
    return null
  }
}