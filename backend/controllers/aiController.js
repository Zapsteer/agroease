const axios  = require("axios");
const { DiseaseDetection, Product } = require("../models");

// ── Mock disease data for fallback / demo ────────────────
const MOCK_DISEASES = {
  apple: [
    {
      name: "Apple Scab",
      cause: "Venturia inaequalis fungus — zyada nami aur thande mausam mein phailta hai",
      treatment: "Mancozeb 75% WP ya Captan 50% WP spray karein. 10-14 din baad repeat karein.",
      prevention: "Gire hue patte hatao. Hawa ka bahav achha rakho. Drip irrigation use karein.",
      severity: "high",
      keywords: ["apple","pear","dark spots","scab","fungus"],
    },
    {
      name: "Fire Blight",
      cause: "Erwinia amylovora bacteria — barsaat aur garm mausam mein phailta hai",
      treatment: "Copper Oxychloride spray. Infected branches katein (30cm neeche se). Scissors sterilize karein.",
      prevention: "Over-fertilization se bachen. Pruning tools hamesha sterilize karein.",
      severity: "high",
      keywords: ["apple","brown","wilting","blight"],
    },
    {
      name: "Powdery Mildew",
      cause: "Podosphaera leucotricha fungus — dry mausam mein zyada hota hai",
      treatment: "Sulfur-based fungicide spray karein. Hexaconazole 5% SC use karein.",
      prevention: "Darakht mein hawa ka bahav achha rakho. Infected shoots hatao.",
      severity: "medium",
      keywords: ["white","powder","mildew","apple"],
    },
  ],
  peach: [
    {
      name: "Peach Leaf Curl",
      cause: "Taphrina deformans fungus — bud break ke time zyada hota hai",
      treatment: "Bordeaux Mixture ya Ziram spray karein. Bud break se pehle spray zaroori.",
      prevention: "Dormant season mein preventive copper spray karein.",
      severity: "medium",
      keywords: ["peach","curl","twisted","red"],
    },
  ],
  general: [
    {
      name: "Leaf Blight",
      cause: "Fungal/bacterial infection — zyada nami ya kharab hava ki wajah se",
      treatment: "Copper Oxychloride 50% WP spray karein. Infected patte immediately hatao.",
      prevention: "Proper spacing rakho. Irrigation timing manage karein.",
      severity: "medium",
      keywords: ["blight","brown","spots"],
    },
    {
      name: "Nitrogen Deficiency",
      cause: "Mitti mein nitrogen ki kami — yellow patte is ki nishani hain",
      treatment: "Urea (46% N) spray ya soil application karein. 45:45:45 NPK dein.",
      prevention: "Regular soil testing karein. Organic manure use karein.",
      severity: "low",
      keywords: ["yellow","pale","deficiency","nitrogen"],
    },
  ],
};

function mockDetect(cropType) {
  const diseases = MOCK_DISEASES[cropType] || MOCK_DISEASES.general;
  return diseases[Math.floor(Math.random() * diseases.length)];
}

// ── POST /api/ai/detect ──────────────────────────────────
exports.detectDisease = async (req, res) => {
  try {
    const { imageBase64, imageUrl, cropType = "general" } = req.body;
    if (!imageBase64 && !imageUrl)
      return res.status(400).json({ success: false, message: "Image dein (base64 ya URL)" });

    let detection;

    // Try OpenAI Vision first
    if (process.env.OPENAI_API_KEY) {
      try {
        const imageContent = imageUrl
          ? { type: "image_url", image_url: { url: imageUrl } }
          : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            max_tokens: 500,
            messages: [{
              role: "user",
              content: [
                imageContent,
                {
                  type: "text",
                  text: `You are an expert agricultural scientist for Himachal Pradesh, India.
Analyze this plant/crop image and respond ONLY in this exact JSON format:
{
  "diseaseName": "Disease name in English",
  "cropType": "apple/peach/wheat/maize/other",
  "confidence": 85,
  "cause": "Cause in simple Hindi-friendly English",
  "treatment": "Step by step treatment in simple language",
  "prevention": "Prevention tips",
  "severity": "low/medium/high",
  "recommendedProductKeywords": ["keyword1","keyword2"]
}
If it's a healthy plant, set diseaseName to "Healthy Plant" and confidence to 95.
Respond ONLY with valid JSON, no extra text.`,
                },
              ],
            }],
          },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        "Content-Type": "application/json" } }
        );

        const raw = response.data.choices[0].message.content.trim();
        const json = JSON.parse(raw.replace(/```json|```/g, "").trim());

        detection = {
          diseaseName: json.diseaseName,
          confidence:  json.confidence || 80,
          cause:       json.cause,
          treatment:   json.treatment,
          prevention:  json.prevention,
          severity:    json.severity || "medium",
          keywords:    json.recommendedProductKeywords || [],
          cropType:    json.cropType || cropType,
        };
      } catch (aiErr) {
        console.error("OpenAI error, using mock:", aiErr.message);
        detection = { ...mockDetect(cropType), confidence: 80, keywords: [] };
      }
    } else {
      // Use mock data in development
      detection = { ...mockDetect(cropType), confidence: 80, keywords: [] };
    }

    // Find recommended products
    const productQuery = {
      isActive: true,
      $or: [
        { category: { $in: ["pesticide","fertilizer"] } },
        ...(detection.keywords || []).map(k => ({ $or: [
          { name: { $regex: k, $options: "i" } },
          { tags: { $regex: k, $options: "i" } },
        ]})),
      ],
    };
    const recommendedProducts = await Product.find(productQuery)
      .populate("seller","name shopName")
      .limit(4);

    // Save to DB
    const record = await DiseaseDetection.create({
      user:        req.user?.userId,
      imageUrl:    imageUrl || "uploaded",
      cropType:    detection.cropType || cropType,
      diseaseName: detection.diseaseName,
      confidence:  detection.confidence,
      cause:       detection.cause,
      treatment:   detection.treatment,
      prevention:  detection.prevention,
      severity:    detection.severity,
      recommendedProducts: recommendedProducts.map(p => p._id),
      status: "completed",
    });

    res.json({
      success: true,
      detection: {
        _id:        record._id,
        diseaseName:detection.diseaseName,
        confidence: detection.confidence,
        cropType:   detection.cropType || cropType,
        cause:      detection.cause,
        treatment:  detection.treatment,
        prevention: detection.prevention,
        severity:   detection.severity,
        recommendedProducts,
      },
    });
  } catch (err) {
    console.error("detectDisease error:", err);
    res.status(500).json({ success: false, message: "Detection mein error aaya" });
  }
};

// ── GET /api/ai/history ──────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const history = await DiseaseDetection.find({
      user: req.user.userId, status: "completed",
    }).populate("recommendedProducts","name price images")
      .sort({ createdAt: -1 }).limit(10);

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
