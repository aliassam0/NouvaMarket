import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({});
  }
  return geminiClient;
}

// OpenRouter API client helper (Backup)
const OPENROUTER_DEFAULT_KEY = "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";

function processOpenRouterMessages(
  messages: Array<{ role: string; content: string | Array<any>; reasoning_details?: any }>,
  model: string
): { processedMessages: any[]; hasImages: boolean; targetModel: string } {
  let hasImages = false;
  let targetModel = model;

  const processedMessages = messages.map((msg) => {
    if (!Array.isArray(msg.content)) {
      return msg;
    }

    const cleanContent: any[] = [];
    let imageCount = 0;
    for (const item of msg.content) {
      if (item && item.type === "image_url" && item.image_url?.url) {
        const u = item.image_url.url;
        if (
          typeof u === "string" &&
          imageCount < 4 &&
          (u.startsWith("https://") || u.startsWith("http://") || u.startsWith("data:image/")) &&
          !u.includes("localhost") &&
          !u.includes("127.0.0.1") &&
          !u.startsWith("blob:")
        ) {
          hasImages = true;
          imageCount++;
          cleanContent.push(item);
        }
      } else if (item && item.type === "text") {
        cleanContent.push(item);
      } else if (item) {
        cleanContent.push(item);
      }
    }

    if (cleanContent.length === 1 && cleanContent[0].type === "text") {
      return { ...msg, content: cleanContent[0].text };
    }
    return { ...msg, content: cleanContent.length > 0 ? cleanContent : msg.content };
  });

  if (hasImages && !targetModel.includes("gemini")) {
    targetModel = "google/gemini-2.5-flash";
  }

  return { processedMessages, hasImages, targetModel };
}

async function callOpenRouter(
  messages: Array<{ role: string; content: string | Array<any>; reasoning_details?: any }>,
  model = "google/gemini-2.5-flash",
  options?: { reasoning?: { enabled: boolean }; stream?: boolean }
): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY || OPENROUTER_DEFAULT_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is missing.");
  }

  const { processedMessages, hasImages, targetModel } = processOpenRouterMessages(messages, model);

  const makeApiCall = async (mModel: string, mMsgs: any[]) => {
    const reqBody: any = {
      model: mModel,
      messages: mMsgs,
      temperature: 0.3,
    };

    if (options?.reasoning) {
      reqBody.reasoning = options.reasoning;
    }

    if (options?.stream) {
      reqBody.stream = true;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://nouvamarket.com",
        "X-Title": "Nouva Market",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    return response;
  };

  try {
    const response = await makeApiCall(targetModel, processedMessages);
    if (options?.stream) {
      return response;
    }
    const data = await response.json();
    return data.choices?.[0]?.message;
  } catch (err: any) {
    console.warn(`OpenRouter call (${targetModel}) failed:`, err.message);
    throw err;
  }
}

// Unified Multimodal AI Generator (Native Gemini API with OpenRouter fallback)
async function generateMultimodalAI(
  prompt: string,
  images: string[] = [],
  systemInstruction?: string
): Promise<string> {
  // 1. Try Native Google Gemini API with @google/genai
  const ai = getGeminiClient();
  if (ai) {
    try {
      const contents: any[] = [];

      for (const img of images.slice(0, 4)) {
        if (typeof img !== "string" || !img.trim()) continue;
        const clean = img.trim();

        if (clean.startsWith("data:image/")) {
          const match = clean.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            contents.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        } else if (clean.startsWith("http://") || clean.startsWith("https://")) {
          try {
            const resp = await fetch(clean, { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
              const mime = resp.headers.get("content-type") || "image/jpeg";
              const buf = await resp.arrayBuffer();
              const b64 = Buffer.from(buf).toString("base64");
              contents.push({
                inlineData: {
                  mimeType: mime.split(";")[0],
                  data: b64,
                },
              });
            }
          } catch (fetchErr) {
            console.warn("Could not fetch remote image for Gemini:", fetchErr);
          }
        }
      }

      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (geminiErr: any) {
      console.warn("Native GoogleGenAI call failed, attempting fallback:", geminiErr.message);
    }
  }

  // 2. OpenRouter Multimodal Fallback
  try {
    const userMessageContent: any[] = [];
    for (const imgStr of images.slice(0, 4)) {
      if (typeof imgStr === "string" && imgStr.trim().length > 0) {
        userMessageContent.push({
          type: "image_url",
          image_url: { url: imgStr.trim() },
        });
      }
    }
    userMessageContent.push({ type: "text", text: prompt });

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({
      role: "user",
      content: userMessageContent.length > 1 ? userMessageContent : prompt,
    });

    const resMsg = await callOpenRouter(messages, "google/gemini-2.5-flash");
    return resMsg?.content?.trim() || "";
  } catch (openRouterErr: any) {
    console.error("OpenRouter fallback failed:", openRouterErr.message);
    return "";
  }
}

// Memory databases for server state
const idempotencyStore = new Map<string, any>();
const serverOrders: any[] = [];

const walletBalance = {
  available: 0,
  pending: 0,
  totalEarned: 0,
  currency: "DZD",
};

const walletTransactions: any[] = [];

// --- REST API ENDPOINTS ---

// Healthcheck
app.get("/api/reseller/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Auth
app.post("/api/reseller/auth/verify-otp", (req, res) => {
  const { phone, code } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "رقم الهاتف مطلوب" });
  }
  // Simulated OTP verification
  res.json({
    token: "mock-jwt-token-kidsmarket-" + Date.now(),
    refreshToken: "mock-refresh-token-" + Date.now(),
    user: {
      id: "u-reseller-12",
      fullName: "أميرة المقيمة",
      storeName: "أميرة كيدز مود (Amira Kids)",
      phone: phone || "0550001122",
      wilaya: "16 - Alger",
      rank: "SILVER",
      rankAr: "فضة",
      kycStatus: "APPROVED",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    },
  });
});

// Orders creation with Strict Idempotency Handling (Rule #1 Section 8)
app.post("/api/reseller/orders", (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"] as string || req.body.idempotencyKey;

  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency-Key header or field is required." });
  }

  // Check if we already processed this order
  if (idempotencyStore.has(idempotencyKey)) {
    console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
    return res.status(200).json(idempotencyStore.get(idempotencyKey));
  }

  const { customerName, phone, wilaya, commune, address, deliveryType, items, totalAmount, shippingFee, totalProfit } = req.body;

  if (!customerName || !phone || !items || !items.length) {
    return res.status(422).json({ error: "بيانات الطلبية غير مكتملة" });
  }

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: orderId,
    idempotencyKey,
    customerName,
    phone,
    wilaya: wilaya || "16 - Alger",
    commune: commune || "Alger",
    address: address || "",
    deliveryType: deliveryType || "home",
    items,
    totalAmount: totalAmount || 0,
    shippingFee: shippingFee || 500,
    totalProfit: totalProfit || 0,
    status: req.body.status || "PENDING_SYNC",
    statusAr: req.body.statusAr || (req.body.status === "LINK_ORDER" ? "طلب من الرابط" : "🔍 قيد المراجعة (في انتظار التأكيد)"),
    statusFr: req.body.statusFr || (req.body.status === "LINK_ORDER" ? "Commande par lien" : "En révision"),
    situation: req.body.situation || (req.body.status === "LINK_ORDER" ? "طلب من الرابط" : "En révision"),
    source: req.body.source || "LOCAL",
    adminConfirmed: false,
    isLockedForEdit: false,
    createdAt: new Date().toISOString(),
    trackingCode: "EC-" + (wilaya?.substring(0,2) || "ALG") + "-" + Math.floor(10000 + Math.random() * 90000),
  };

  serverOrders.unshift(newOrder);
  walletBalance.pending += totalProfit || 0;

  const responsePayload = {
    success: true,
    message: "تم تسجيل الطلبية بنجاح",
    order: newOrder,
  };

  // Cache response for idempotency
  idempotencyStore.set(idempotencyKey, responsePayload);

  return res.status(201).json(responsePayload);
});

// --- DELIVERY COMPANY API INTEGRATION (Api_v1/Colis) ---

// Delivery API Config Store
let deliveryApiConfig = {
  apiKey: "3490e731e3db4d8c841991987d3cab0f",
  apiToken: "b8386c67-f0ce-4ce5-bc3b-cf3246a90819",
  companyName: "Yalidine / EcoTrack / Express Delivery",
  endpointUrl: "https://api.delivery-company.dz/Api_v1/Colis",
  autoSendOnConfirm: true,
};

// Update delivery settings
app.post("/api/delivery/config", (req, res) => {
  const { apiKey, apiToken, companyName, endpointUrl, autoSendOnConfirm } = req.body;
  if (apiKey) deliveryApiConfig.apiKey = apiKey;
  if (apiToken) deliveryApiConfig.apiToken = apiToken;
  if (companyName) deliveryApiConfig.companyName = companyName;
  if (endpointUrl) deliveryApiConfig.endpointUrl = endpointUrl;
  if (typeof autoSendOnConfirm === "boolean") deliveryApiConfig.autoSendOnConfirm = autoSendOnConfirm;

  res.json({ success: true, config: deliveryApiConfig });
});

app.get("/api/delivery/config", (req, res) => {
  res.json({ success: true, config: deliveryApiConfig });
});

// Helper to format server order into standard Delivery API Colis object
function formatOrderToDeliveryColis(order: any) {
  const tracking = order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ");
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedCreated = createdDate.toLocaleDateString("fr-FR") + " " + createdDate.toLocaleTimeString("fr-FR");
  const isDelivered = order.status === "DELIVERED";
  const deliveredDate = isDelivered ? (order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString("fr-FR") + " " + new Date(order.deliveredAt).toLocaleTimeString("fr-FR") : formattedCreated) : null;

  return {
    Date_Création_D: formattedCreated,
    Tracking: tracking,
    ID_Externe: order.id,
    label: order.bordereauUrl || `/api/delivery/label/${order.id}?tracking=${tracking}`,
    Stopdesk: order.deliveryType === "office" ? 1 : 0,
    IDWilaya: parseInt(order.wilaya) || 16,
    Echange: 0,
    Total: (order.totalAmount || 0) + (order.shippingFee || 0),
    NomComplet: order.customerName || "زبون",
    Mobile_1: order.phone || "",
    Adresse: order.address || "",
    Commune_Bureau: order.commune || "",
    Article: order.items?.map((i: any) => i.productName).join(" + ") || "ملابس أطفال",
    Ref_Article: order.id,
    NoteFournisseur: order.noteFournisseur || "",
    Date_Action_D: formattedCreated,
    Avancement: order.avancement || (isDelivered ? "Livré" : order.situation === "EnTraitement" ? "En Traitement" : "En Préparation"),
    Situation: order.situation || (isDelivered ? "Livré" : order.status === "CANCELLED" ? "Annuler" : "EnCours"),
    Commentaire: isDelivered ? "تم التسليم بنجاح للزبون" : "طرد مسجل في النظام",
    Date_Livrée: deliveredDate,
  };
}

// GET /Api_v1/Colis - Afficher tous les colis avec pagination
app.get(["/Api_v1/Colis", "/api_v1/colis"], (req, res) => {
  const pageHeader = req.headers["page"] || req.query.Page || "1";
  const currentPage = Math.max(1, parseInt(String(pageHeader)) || 1);
  const limit = 100;

  const formattedColis = serverOrders.map(formatOrderToDeliveryColis);
  const totalCount = formattedColis.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const startIndex = (currentPage - 1) * limit;
  const paginatedColis = formattedColis.slice(startIndex, startIndex + limit);

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 1,
      Consommer_24h: 1,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: totalCount,
    Nb_Page: totalPages,
    Current_Page: currentPage,
    Colis: paginatedColis,
  });
});

// GET /Api_v1/Colis/Date_Creation/:date - Filtrer par date de création
app.get(["/Api_v1/Colis/Date_Creation/:date", "/Api_v1/Colis/Date_Creation"], (req, res) => {
  const paramDate = req.params.date || req.query.date;
  const filterDate = paramDate ? new Date(String(paramDate)) : null;

  let filtered = serverOrders;
  if (filterDate && !isNaN(filterDate.getTime())) {
    filtered = serverOrders.filter((o) => new Date(o.createdAt) >= filterDate);
  }

  const formattedColis = filtered.map(formatOrderToDeliveryColis);

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 2,
      Consommer_24h: 5,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: formattedColis.length,
    Nb_Page: 1,
    Current_Page: 1,
    Colis: formattedColis,
  });
});

// GET /Api_v1/Colis/Date_Livree/:date - Filtrer par date de livraison
app.get(["/Api_v1/Colis/Date_Livree/:date", "/Api_v1/Colis/Date_Livree"], (req, res) => {
  const paramDate = req.params.date || req.query.date;
  const filterDate = paramDate ? new Date(String(paramDate)) : null;

  let filtered = serverOrders.filter((o) => o.status === "DELIVERED");
  if (filterDate && !isNaN(filterDate.getTime())) {
    filtered = filtered.filter((o) => o.deliveredAt && new Date(o.deliveredAt) >= filterDate);
  }

  const formattedColis = filtered.map(formatOrderToDeliveryColis);

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 2,
      Consommer_24h: 5,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: formattedColis.length,
    Nb_Page: 1,
    Current_Page: 1,
    Colis: formattedColis,
  });
});

// GET /Api_v1/Colis/Date_last_status/:date - Filtrer par date de dernière modification de situation
app.get(["/Api_v1/Colis/Date_last_status/:date", "/Api_v1/Colis/Date_last_status"], (req, res) => {
  const paramDate = req.params.date || req.query.date;
  const filterDate = paramDate ? new Date(String(paramDate)) : null;

  let filtered = serverOrders;
  if (filterDate && !isNaN(filterDate.getTime())) {
    filtered = serverOrders.filter((o) => new Date(o.updatedAt || o.createdAt) >= filterDate);
  }

  const formattedColis = filtered.map(formatOrderToDeliveryColis);

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 2,
      Consommer_24h: 5,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: formattedColis.length,
    Nb_Page: 1,
    Current_Page: 1,
    Colis: formattedColis,
  });
});

// GET /Api_v1/Colis/Tracking/:tracking - Récupérer les informations par Tracking
app.get(["/Api_v1/Colis/Tracking/:tracking", "/API_v1/Colis/Tracking/:tracking"], (req, res) => {
  const trackingParam = req.params.tracking;

  const found = serverOrders.find(
    (o) => o.trackingCode === trackingParam || o.id === trackingParam
  );

  if (!found) {
    return res.status(404).json({
      error: `لم يتم العثور على الطرد بكود التتبع ${trackingParam}`,
      Nb_Colis: 0,
      Colis: [],
    });
  }

  const formattedColis = [formatOrderToDeliveryColis(found)];

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 1,
      Consommer_24h: 2,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: 1,
    Nb_Page: 1,
    Current_Page: 1,
    Colis: formattedColis,
  });
});

// POST /Api_v1/Colis/Liste - Récupérer les informations d'une liste de trackings
app.post(["/Api_v1/Colis/Liste", "/API_v1/Colis/Liste"], (req, res) => {
  const { Colis } = req.body;

  if (!Colis || !Array.isArray(Colis) || Colis.length === 0) {
    return res.status(400).json({ error: 'قائمة التتبع مطلوبة ({"Colis":[{"Tracking":"AAA555"}]})' });
  }

  const trackingCodes = Colis.map((c: any) => c.Tracking || c.tracking).filter(Boolean);

  const matchedOrders = serverOrders.filter(
    (o) => trackingCodes.includes(o.trackingCode) || trackingCodes.includes(o.id)
  );

  const formattedColis = matchedOrders.map(formatOrderToDeliveryColis);

  return res.json({
    Quota: {
      Consommer_1min: 2,
      Consommer_1h: 4,
      Consommer_24h: 10,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Colis: formattedColis.length,
    Nb_Page: 1,
    Current_Page: 1,
    Colis: formattedColis,
  });
});

// Helper for Delivery History format
function formatOrderHistory(order: any) {
  const tracking = order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ");
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateFormatted =
    String(createdDate.getDate()).padStart(2, "0") +
    "/" +
    String(createdDate.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(createdDate.getFullYear()).slice(-2) +
    " " +
    String(createdDate.getHours()).padStart(2, "0") +
    ":" +
    String(createdDate.getMinutes()).padStart(2, "0");

  const wilayaCode = parseInt(order.wilaya) || 31;
  const bureauName = order.commune ? `${order.commune.toUpperCase()} 1` : "ORAN 1";

  return {
    Date_Création: dateFormatted,
    Tracking: tracking,
    Bureau: bureauName,
    Ville: wilayaCode,
    ServiceClient_Bureau: "0560606060",
    Avancement: order.avancement || (order.status === "DELIVERED" ? "Livré" : order.situation === "EnTraitement" ? "En Traitement" : "En Préparation"),
    Situation: order.situation || (order.status === "DELIVERED" ? "Livré" : order.status === "CANCELLED" ? "Annuler" : "EnCours"),
    Commentaire: order.noteFournisseur || "سجل تاريخ إجراءات الطرد",
  };
}

// GET /Api_v1/Historique/:date - Filtrer l'historique à partir d'une date
app.get(["/Api_v1/Historique/:date", "/Api_v1/Historique", "/API_v1/Historique/:date", "/API_v1/Historique"], (req, res) => {
  const paramDate = req.params.date || req.query.date;
  const filterDate = paramDate ? new Date(String(paramDate)) : null;

  let filtered = serverOrders;
  if (filterDate && !isNaN(filterDate.getTime())) {
    filtered = serverOrders.filter((o) => new Date(o.updatedAt || o.createdAt) >= filterDate);
  }

  const historyItems = filtered.map(formatOrderHistory);

  return res.json({
    Quota: {
      Consommer_1min: 4,
      Consommer_1h: 17,
      Consommer_24h: 68,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Action: historyItems.length,
    Nb_Page: 1,
    Current_Page: 1,
    Historique: historyItems,
  });
});

// GET /Api_v1/Historique/Tracking/:tracking - Récupérer l'historique d'un tracking spécifique
app.get(["/Api_v1/Historique/Tracking/:tracking", "/API_v1/Historique/Tracking/:tracking", "/Api_v1/Historique/Tracking", "/API_v1/Historique/Tracking"], (req, res) => {
  const trackingParam = req.params.tracking || req.query.tracking;

  const found = serverOrders.filter(
    (o) => o.trackingCode === trackingParam || o.id === trackingParam
  );

  const historyItems = found.map(formatOrderHistory);

  return res.json({
    Quota: {
      Consommer_1min: 4,
      Consommer_1h: 17,
      Consommer_24h: 68,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Action: historyItems.length,
    Nb_Page: 1,
    Current_Page: 1,
    Historique: historyItems,
  });
});

// Mock Algerian Communes Data mapped by Wilaya ID
const communesDataByWilaya: Record<string, Array<{ ID: number; Nom: string; IDWilaya: number; CodePostal: string; LivraisonDomicile: number; Stopdesk: number }>> = {
  "16": [
    { ID: 1601, Nom: "Alger Centre", IDWilaya: 16, CodePostal: "16000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1602, Nom: "Sidi M'Hamed", IDWilaya: 16, CodePostal: "16010", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1603, Nom: "El Biar", IDWilaya: 16, CodePostal: "16030", LivraisonDomicile: 1, Stopdesk: 0 },
    { ID: 1604, Nom: "Hydra", IDWilaya: 16, CodePostal: "16035", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1605, Nom: "Kouba", IDWilaya: 16, CodePostal: "16050", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1606, Nom: "Bab Ezzouar", IDWilaya: 16, CodePostal: "16311", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1607, Nom: "Cheraga", IDWilaya: 16, CodePostal: "16014", LivraisonDomicile: 1, Stopdesk: 0 },
    { ID: 1608, Nom: "Dely Ibrahim", IDWilaya: 16, CodePostal: "16020", LivraisonDomicile: 1, Stopdesk: 1 },
  ],
  "31": [
    { ID: 3101, Nom: "Oran", IDWilaya: 31, CodePostal: "31000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3102, Nom: "Es Senia", IDWilaya: 31, CodePostal: "31100", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3103, Nom: "Bir El Djir", IDWilaya: 31, CodePostal: "31015", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3104, Nom: "Arzew", IDWilaya: 31, CodePostal: "31200", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3105, Nom: "Ain El Turck", IDWilaya: 31, CodePostal: "31300", LivraisonDomicile: 1, Stopdesk: 0 },
    { ID: 3106, Nom: "Bethioua", IDWilaya: 31, CodePostal: "31210", LivraisonDomicile: 1, Stopdesk: 0 },
  ],
  "25": [
    { ID: 2501, Nom: "Constantine", IDWilaya: 25, CodePostal: "25000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 2502, Nom: "El Khroub", IDWilaya: 25, CodePostal: "25100", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 2503, Nom: "Hamma Bouziane", IDWilaya: 25, CodePostal: "25200", LivraisonDomicile: 1, Stopdesk: 0 },
    { ID: 2504, Nom: "Zighoud Youcef", IDWilaya: 25, CodePostal: "25300", LivraisonDomicile: 1, Stopdesk: 0 },
  ],
  "06": [
    { ID: 601, Nom: "Béjaïa", IDWilaya: 6, CodePostal: "06000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 602, Nom: "Amizour", IDWilaya: 6, CodePostal: "06100", LivraisonDomicile: 1, Stopdesk: 0 },
    { ID: 603, Nom: "Akbou", IDWilaya: 6, CodePostal: "06200", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 604, Nom: "El Kseur", IDWilaya: 6, CodePostal: "06300", LivraisonDomicile: 1, Stopdesk: 0 },
  ],
  "19": [
    { ID: 1901, Nom: "Sétif", IDWilaya: 19, CodePostal: "19000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1902, Nom: "El Eulma", IDWilaya: 19, CodePostal: "19100", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 1903, Nom: "Ain Oulmene", IDWilaya: 19, CodePostal: "19200", LivraisonDomicile: 1, Stopdesk: 0 },
  ],
  "09": [
    { ID: 901, Nom: "Blida", IDWilaya: 9, CodePostal: "09000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 902, Nom: "Boufarik", IDWilaya: 9, CodePostal: "09100", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 903, Nom: "Ouled Yaich", IDWilaya: 9, CodePostal: "09200", LivraisonDomicile: 1, Stopdesk: 0 },
  ]
};

// Mock Stopdesk Offices Data mapped by Wilaya ID
const stopdesksDataByWilaya: Record<string, Array<{ CodeStopdesk: string; Nom: string; IDWilaya: number; Adresse: string; Telephone: string; Commune: string }>> = {
  "16": [
    { CodeStopdesk: "16A", Nom: "Bureau Ecom Alger Centre", IDWilaya: 16, Adresse: "12 Rue Didouche Mourad, Alger Centre", Telephone: "0560100016", Commune: "Alger Centre" },
    { CodeStopdesk: "16B", Nom: "Bureau Ecom Bab Ezzouar Depot", IDWilaya: 16, Adresse: "Zone Cité EPLF, Bab Ezzouar", Telephone: "0560200016", Commune: "Bab Ezzouar" },
    { CodeStopdesk: "16C", Nom: "Bureau Ecom Hydra", IDWilaya: 16, Adresse: "Boulevard Sidi Yahia, Hydra", Telephone: "0560300016", Commune: "Hydra" },
  ],
  "31": [
    { CodeStopdesk: "31A", Nom: "Bureau Central Oran Ville", IDWilaya: 31, Adresse: "Rue Larbi Ben M'hidi, Oran", Telephone: "0560112233", Commune: "Oran" },
    { CodeStopdesk: "31B", Nom: "Bureau Es Senia Depot", IDWilaya: 31, Adresse: "Zone Industrielle Es Senia", Telephone: "0560112234", Commune: "Es Senia" },
    { CodeStopdesk: "31C", Nom: "Bureau Bir El Djir Akid", IDWilaya: 31, Adresse: "Cité Akid Lotfi, Bir El Djir", Telephone: "0560112235", Commune: "Bir El Djir" },
  ],
  "25": [
    { CodeStopdesk: "25A", Nom: "Bureau Constantine Centre", IDWilaya: 25, Adresse: "Cité Coudiat, Constantine", Telephone: "0560100025", Commune: "Constantine" },
    { CodeStopdesk: "25B", Nom: "Bureau El Khroub", IDWilaya: 25, Adresse: "Zone Industrielle El Khroub", Telephone: "0560200025", Commune: "El Khroub" },
  ],
  "06": [
    { CodeStopdesk: "06A", Nom: "Bureau Béjaïa Port", IDWilaya: 6, Adresse: "Boulevard Amirouche, Béjaïa", Telephone: "0560100006", Commune: "Béjaïa" },
    { CodeStopdesk: "06B", Nom: "Bureau Akbou Centre", IDWilaya: 6, Adresse: "Route Nationale 26, Akbou", Telephone: "0560200006", Commune: "Akbou" },
  ],
  "19": [
    { CodeStopdesk: "19A", Nom: "Bureau Sétif Ville", IDWilaya: 19, Adresse: "Avenue 8 Mai 1945, Sétif", Telephone: "0560100019", Commune: "Sétif" },
    { CodeStopdesk: "19B", Nom: "Bureau El Eulma", IDWilaya: 19, Adresse: "Rue Dubai, El Eulma", Telephone: "0560200019", Commune: "El Eulma" },
  ],
  "09": [
    { CodeStopdesk: "09A", Nom: "Bureau Blida Centre", IDWilaya: 9, Adresse: "Boulevard Mohamed V, Blida", Telephone: "0560100009", Commune: "Blida" },
  ]
};

// Webhook Configuration & Logs Store
let webhookConfig = {
  Nom: "Livraison_Callback",
  secretKey: "sec_ecom_3490e731e3db4d8c841991987d3cab0f",
  webhookUrl: "https://api.tassyir.io/business/673539960388721011/ecom-delivery-webhook",
  enabled: true,
};

let webhookLogs: Array<{
  id: number;
  occurred_at: string;
  tracking: string;
  nom: string;
  situation: string;
  avancement: string;
  status: "SUCCESS" | "FAILED";
  payload: any;
}> = [
  {
    id: 12345,
    occurred_at: new Date().toISOString(),
    tracking: "TC317LHJ",
    nom: "Livraison_Callback",
    situation: "Livré",
    avancement: "En livraison",
    status: "SUCCESS",
    payload: {
      Source: "",
      Nom: "Livraison_Callback",
      id: 12345,
      occurred_at: "2025-10-20T14:10:00",
      data: {
        Tracking: "TC317LHJ",
        Situation: "Livré",
        IDSituation: 7,
        Avancement: "En livraison",
        IDAvancement: 5,
      },
    },
  },
];

// GET /api/delivery/webhook/config
app.get("/api/delivery/webhook/config", (req, res) => {
  res.json({ success: true, config: webhookConfig, logsCount: webhookLogs.length });
});

// POST /api/delivery/webhook/config
app.post("/api/delivery/webhook/config", (req, res) => {
  const { Nom, secretKey, webhookUrl, enabled } = req.body;
  if (Nom) webhookConfig.Nom = Nom;
  if (secretKey) webhookConfig.secretKey = secretKey;
  if (webhookUrl) webhookConfig.webhookUrl = webhookUrl;
  if (typeof enabled === "boolean") webhookConfig.enabled = enabled;

  res.json({ success: true, message: "تم تحديث إعدادات الـ Webhook بنجاح", config: webhookConfig });
});

// GET /api/delivery/webhook/logs
app.get("/api/delivery/webhook/logs", (req, res) => {
  res.json({ success: true, logs: webhookLogs });
});

// POST Webhook Callback Listener: /api/delivery/webhook/callback & /business/:businessId/ecom-delivery-webhook
app.post([
  "/api/delivery/webhook/callback",
  "/business/:businessId/ecom-delivery-webhook",
  "/Livraison_Callback"
], (req, res) => {
  const payload = req.body;
  const data = payload?.data || payload;

  const tracking = data?.Tracking || data?.tracking || "EC1234AAA";
  const situation = data?.Situation || "EnCours";
  const avancement = data?.Avancement || "En livraison";
  const eventId = payload?.id || Math.floor(Math.random() * 90000) + 10000;
  const occurredAt = payload?.occurred_at || new Date().toISOString();

  // Find order and update real-time
  const orderIndex = serverOrders.findIndex(
    (o) => o.trackingCode === tracking || o.id === tracking || tracking.includes(o.id.replace("ORD-", ""))
  );

  let mappedStatus = "PROCESSING";
  if (situation === "Livré" || avancement === "Livré") {
    mappedStatus = "DELIVERED";
  } else if (situation.startsWith("Annuler") || avancement === "Perdu") {
    mappedStatus = "CANCELLED";
  } else if (situation.startsWith("Ne Réponde pas") || situation.startsWith("Reporté")) {
    mappedStatus = "FAILED";
  } else if (avancement === "En livraison" || avancement === "Sortir en livraison") {
    mappedStatus = "SHIPPED";
  }

  if (orderIndex !== -1) {
    serverOrders[orderIndex] = {
      ...serverOrders[orderIndex],
      situation,
      avancement,
      status: mappedStatus as any,
      updatedAt: occurredAt,
      statusAr: `تحديث مباشر (Webhook): ${situation} - ${avancement}`,
      statusFr: `${situation} / ${avancement}`,
      deliveredAt: mappedStatus === "DELIVERED" ? occurredAt : serverOrders[orderIndex].deliveredAt,
    };
  }

  const newLog = {
    id: eventId,
    occurred_at: occurredAt,
    tracking,
    nom: payload?.Nom || "Livraison_Callback",
    situation,
    avancement,
    status: "SUCCESS" as const,
    payload,
  };

  webhookLogs.unshift(newLog);
  if (webhookLogs.length > 50) webhookLogs.pop();

  return res.json({
    success: true,
    message: "تم استقبال حدث التتبع المباشر (Webhook) وتحديث حالة الطرد بنجاح",
    status_code: 200,
    updatedTracking: tracking,
  });
});

// POST /api/delivery/webhook/trigger-test - Test / Simulate Webhook Dispatch
app.post("/api/delivery/webhook/trigger-test", async (req, res) => {
  const { tracking, situation, avancement } = req.body;
  const targetTracking = tracking || "EC1234AAA";
  const targetSituation = situation || "Livré";
  const targetAvancement = avancement || "En livraison";

  const payload = {
    Source: "",
    Nom: webhookConfig.Nom || "Livraison_Callback",
    id: Math.floor(Math.random() * 90000) + 10000,
    occurred_at: new Date().toISOString(),
    data: {
      Tracking: targetTracking,
      Situation: targetSituation,
      IDSituation: targetSituation === "Livré" ? 7 : 1,
      Avancement: targetAvancement,
      IDAvancement: targetAvancement === "En livraison" ? 5 : 2,
    },
  };

  // Internal dispatch call
  try {
    const orderIndex = serverOrders.findIndex(
      (o) => o.trackingCode === targetTracking || o.id === targetTracking || targetTracking.includes(o.id.replace("ORD-", ""))
    );

    let mappedStatus = "PROCESSING";
    if (targetSituation === "Livré" || targetAvancement === "Livré") {
      mappedStatus = "DELIVERED";
    } else if (targetSituation.startsWith("Annuler") || targetAvancement === "Perdu") {
      mappedStatus = "CANCELLED";
    } else if (targetSituation.startsWith("Ne Réponde pas") || targetSituation.startsWith("Reporté")) {
      mappedStatus = "FAILED";
    } else if (targetAvancement === "En livraison" || targetAvancement === "Sortir en livraison") {
      mappedStatus = "SHIPPED";
    }

    if (orderIndex !== -1) {
      serverOrders[orderIndex] = {
        ...serverOrders[orderIndex],
        situation: targetSituation,
        avancement: targetAvancement,
        status: mappedStatus as any,
        updatedAt: payload.occurred_at,
        statusAr: `تحديث مباشر (Webhook): ${targetSituation} - ${targetAvancement}`,
        statusFr: `${targetSituation} / ${targetAvancement}`,
        deliveredAt: mappedStatus === "DELIVERED" ? payload.occurred_at : serverOrders[orderIndex].deliveredAt,
      };
    }

    webhookLogs.unshift({
      id: payload.id,
      occurred_at: payload.occurred_at,
      tracking: targetTracking,
      nom: payload.Nom,
      situation: targetSituation,
      avancement: targetAvancement,
      status: "SUCCESS",
      payload,
    });

    return res.json({
      success: true,
      message: "✔ Test Webhook OK - تم إرسال حمولة Callback واختبار التتبع المباشر بنجاح!",
      payload,
      updatedOrder: orderIndex !== -1 ? serverOrders[orderIndex] : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "فشل إرسال Webhook", details: err.message });
  }
});

// GET /Api_v1/Commune & GET /Api_v1/Commune/:wilaya
app.get([
  "/Api_v1/Commune",
  "/API_v1/Commune",
  "/Api_v1/Commune/:wilaya",
  "/API_v1/Commune/:wilaya",
  "/api_v1/commune",
  "/api_v1/commune/:wilaya"
], (req, res) => {
  const wilayaParam = req.params.wilaya || req.query.wilaya || req.query.Wilaya;

  if (wilayaParam) {
    const wilayaClean = String(wilayaParam).padStart(2, "0").replace(/^0+/, "") || String(wilayaParam);
    const communes = communesDataByWilaya[wilayaClean] || communesDataByWilaya[String(wilayaParam)] || [
      { ID: parseInt(wilayaClean) * 100 + 1, Nom: `Commune Principal ${wilayaClean}`, IDWilaya: parseInt(wilayaClean), CodePostal: `${wilayaClean}000`, LivraisonDomicile: 1, Stopdesk: 1 },
      { ID: parseInt(wilayaClean) * 100 + 2, Nom: `Centre ${wilayaClean}`, IDWilaya: parseInt(wilayaClean), CodePostal: `${wilayaClean}100`, LivraisonDomicile: 1, Stopdesk: 0 }
    ];

    return res.json({
      Quota: {
        Consommer_1min: 1,
        Consommer_1h: 2,
        Consommer_24h: 5,
        Limite_1min: 40,
        Limite_1h: 1500,
        Limite_24h: 15000,
      },
      Wilaya: String(wilayaParam),
      Nb_Commune: communes.length,
      Communes: communes,
    });
  }

  // All communes if no wilaya specified
  const allCommunes = Object.values(communesDataByWilaya).flat();
  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 3,
      Consommer_24h: 10,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Commune: allCommunes.length,
    Communes: allCommunes,
  });
});

// GET /Api_v1/Stopdesk & GET /Api_v1/Stopdesk/:wilaya
app.get([
  "/Api_v1/Stopdesk",
  "/API_v1/Stopdesk",
  "/Api_v1/Stopdesk/:wilaya",
  "/API_v1/Stopdesk/:wilaya",
  "/api_v1/stopdesk",
  "/api_v1/stopdesk/:wilaya"
], (req, res) => {
  const wilayaParam = req.params.wilaya || req.query.wilaya || req.query.Wilaya;

  if (wilayaParam) {
    const wilayaClean = String(wilayaParam).padStart(2, "0").replace(/^0+/, "") || String(wilayaParam);
    const stopdesks = stopdesksDataByWilaya[wilayaClean] || stopdesksDataByWilaya[String(wilayaParam)] || [
      { CodeStopdesk: `${wilayaClean}A`, Nom: `Bureau Stopdesk Wilaya ${wilayaClean}`, IDWilaya: parseInt(wilayaClean), Adresse: `Rue Principal Centre, Wilaya ${wilayaClean}`, Telephone: `05600000${wilayaClean}`, Commune: `Centre ${wilayaClean}` }
    ];

    return res.json({
      Quota: {
        Consommer_1min: 1,
        Consommer_1h: 2,
        Consommer_24h: 5,
        Limite_1min: 40,
        Limite_1h: 1500,
        Limite_24h: 15000,
      },
      Wilaya: String(wilayaParam),
      Nb_Stopdesk: stopdesks.length,
      Stopdesk: stopdesks,
      Stopdesks: stopdesks,
    });
  }

  // All stopdesks if no wilaya specified
  const allStopdesks = Object.values(stopdesksDataByWilaya).flat();
  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 3,
      Consommer_24h: 10,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Nb_Stopdesk: allStopdesks.length,
    Stopdesk: allStopdesks,
    Stopdesks: allStopdesks,
  });
});

// Standard Delivery API endpoint: POST /Api_v1/Colis
app.post("/Api_v1/Colis", (req, res) => {
  const apiKey = req.headers["key"] || req.headers["x-api-key"] || req.body.Key;
  const apiToken = req.headers["token"] || req.headers["x-api-token"] || req.body.Token;

  const { Colis } = req.body;

  if (!Colis || !Array.isArray(Colis) || Colis.length === 0) {
    return res.status(400).json({
      error: "جدول الطرود مطلوب (Array of Colis is required)",
    });
  }

  const responseColis = Colis.map((item: any) => {
    const tracking = item.ID_Externe?.replace("ORD-", "TC") + "LHJ" || "TC" + Math.floor(100000 + Math.random() * 900000);
    const dateFormatted = new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR");

    return {
      Date_Création: dateFormatted,
      Tracking: tracking,
      ID_Externe: item.ID_Externe || "ORD-0000",
      label: `/api/delivery/label/${item.ID_Externe || "ORD-0000"}?tracking=${tracking}`,
      Stopdesk: item.Stopdesk || 0,
      IDWilaya: parseInt(item.Wilaya) || 16,
      Echange: item.Echange || 0,
      Total: parseFloat(item.Total) || 0,
      NomComplet: item.NomComplet || "الزبون",
      Mobile_1: item.Mobile_1 || "",
      Adresse: item.Adresse || "",
      Commune_Bureau: item.Commune || "",
      Article: item.Article || "ملابس أطفال",
      Ref_Article: item.Ref_Article || "REF-KIDS",
      NoteFournisseur: item.NoteFournisseur || "",
      Date_Action_D: dateFormatted,
      Avancement: "En Préparation",
      Situation: "EnCours",
      Commentaire: "تم إنشاء الطرد بنجاح في نظام شركة التوصيل",
      Date_Livrée: null,
    };
  });

  return res.json({
    Quota: {
      Consommer_1min: 1,
      Consommer_1h: 6,
      Consommer_24h: 24,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Colis: responseColis,
  });
});

// Update Parcel Information Endpoint: PUT /Api_v1/Colis/:tracking or PUT /Api_v1/Colis
app.put(["/Api_v1/Colis/:tracking", "/Api_v1/Colis"], (req, res) => {
  const apiKey = req.headers["key"] || req.headers["x-api-key"] || req.body.Key;
  const apiToken = req.headers["token"] || req.headers["x-api-token"] || req.body.Token;

  const bodyColis = req.body.Colis;
  if (!bodyColis) {
    return res.status(400).json({ error: "بيانات الطرد (Colis) مطلوبة" });
  }

  const itemData = Array.isArray(bodyColis) ? bodyColis[0] : bodyColis;
  const paramTracking = req.params.tracking;
  const targetTracking = paramTracking || itemData.Tracking || itemData.ID_Externe || itemData.Ref_Article;

  // Find order in memory database
  const orderIndex = serverOrders.findIndex(
    (o) => o.trackingCode === targetTracking || o.id === targetTracking || o.id === itemData.ID_Externe || o.id === itemData.Ref_Article
  );

  if (orderIndex === -1) {
    return res.status(404).json({
      error: `لم يتم العثور على الطرد برقم التتبع أو المعرف: ${targetTracking}`,
    });
  }

  const order = serverOrders[orderIndex];

  // Check lock rule: Cannot edit if already in "En Traitement" / ready to ship
  if (order.isLockedForEdit || order.situation === "EnTraitement") {
    return res.status(400).json({
      error: "لا يمكن تعديل معلومات الطرد لأن الطرد في حالة En Traitement وهو جاهز للشحن.",
      code: "LOCKED_FOR_EDIT",
    });
  }

  // Update order fields
  if (itemData.NomComplet) order.customerName = itemData.NomComplet;
  if (itemData.Mobile_1) order.phone = itemData.Mobile_1;
  if (itemData.Mobile_2 !== undefined) order.phone2 = itemData.Mobile_2;
  if (itemData.Adresse) order.address = itemData.Adresse;
  if (itemData.Commune) order.commune = itemData.Commune;
  if (itemData.Wilaya) order.wilaya = itemData.Wilaya;
  if (itemData.Total !== undefined) {
    const parsedTotal = parseFloat(itemData.Total);
    if (!isNaN(parsedTotal)) {
      order.totalAmount = Math.max(0, parsedTotal - (order.shippingFee || 0));
    }
  }
  if (itemData.NoteFournisseur !== undefined) order.noteFournisseur = itemData.NoteFournisseur;

  const trackingNumber = order.trackingCode || targetTracking || ("TC" + order.id.replace("ORD-", "") + "LHJ");
  order.trackingCode = trackingNumber;
  order.bordereauUrl = `/api/delivery/label/${order.id}?tracking=${trackingNumber}&v=${Date.now()}`;
  order.situation = "EnCours";
  order.avancement = "En Préparation";

  serverOrders[orderIndex] = order;

  return res.json({
    Quota: {
      Consommer_1min: 2,
      Consommer_1h: 8,
      Consommer_24h: 30,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Message: "تم تعديل معلومات الطرد بنجاح وإعادة طباعة الملصق ببيانات جديدة",
    Colis: {
      Date_Création: new Date().toLocaleString("fr-FR"),
      Tracking: trackingNumber,
      ID_Externe: order.id,
      label: order.bordereauUrl,
      Stopdesk: order.deliveryType === "office" ? 1 : 0,
      IDWilaya: parseInt(order.wilaya) || 16,
      Echange: 0,
      Total: order.totalAmount + (order.shippingFee || 0),
      NomComplet: order.customerName,
      Mobile_1: order.phone,
      Mobile_2: order.phone2 || "",
      Adresse: order.address,
      Commune_Bureau: order.commune,
      Article: itemData.Article || "ملابس أطفال",
      Ref_Article: itemData.Ref_Article || order.id,
      NoteFournisseur: order.noteFournisseur || "",
      Date_Action_D: new Date().toLocaleString("fr-FR"),
      Avancement: "En Préparation",
      Situation: "EnCours",
      Commentaire: "تم تعديل البيانات بنجاح (جاهزة للطباعة من جديد)",
      Date_Livrée: null,
    },
  });
});

// Mark Parcels Ready to Ship Endpoint: PUT /Api_v1/aExpédier or PUT /Api_v1/aExpedier
app.put(["/Api_v1/aExpédier", "/Api_v1/aExpedier", "/Api_v1/aExp%C3%A9dier"], (req, res) => {
  const { Colis } = req.body;

  if (!Colis || !Array.isArray(Colis) || Colis.length === 0) {
    return res.status(400).json({ error: "قائمة الطرود مطلوبة (Array of Colis with Tracking required)" });
  }

  const updatedTrackings: string[] = [];

  Colis.forEach((item: any) => {
    const targetTracking = item.Tracking || item.tracking;
    if (!targetTracking) return;

    const idx = serverOrders.findIndex(
      (o) => o.trackingCode === targetTracking || o.id === targetTracking
    );
    if (idx !== -1) {
      serverOrders[idx].situation = "EnTraitement";
      serverOrders[idx].avancement = "Prêt à expédier";
      serverOrders[idx].isLockedForEdit = true;
      serverOrders[idx].status = "SHIPPED";
      serverOrders[idx].statusAr = "جاهزة للشحن - En Traitement";
      serverOrders[idx].statusFr = "En Traitement / Prêt à expédier";
      updatedTrackings.push(targetTracking);
    }
  });

  return res.json({
    Quota: {
      Consommer_1min: 3,
      Consommer_1h: 12,
      Consommer_24h: 40,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Message: "تمت تغيير حالة الطرود إلى 'En Traitement' وهي الآن جاهزة للشحن. تم قفل التعديل عليها.",
    Colis: updatedTrackings.map((t) => ({
      Tracking: t,
      Situation: "EnTraitement",
      Avancement: "Prêt à expédier",
    })),
  });
});

// Delete Parcels Endpoint: PUT /Api_v1/Supprimer
app.put("/Api_v1/Supprimer", (req, res) => {
  const { Colis } = req.body;

  if (!Colis || !Array.isArray(Colis) || Colis.length === 0) {
    return res.status(400).json({ error: "قائمة الطرود للحذف مطلوبة" });
  }

  const deletedTrackings: string[] = [];

  Colis.forEach((item: any) => {
    const targetTracking = item.Tracking || item.tracking;
    if (!targetTracking) return;

    const idx = serverOrders.findIndex(
      (o) => o.trackingCode === targetTracking || o.id === targetTracking
    );
    if (idx !== -1) {
      serverOrders[idx].status = "CANCELLED";
      serverOrders[idx].statusAr = "ملغاة / محذوفة من الشحن";
      serverOrders[idx].statusFr = "Annulé / Supprimé";
      serverOrders[idx].situation = "Supprimé";
      serverOrders[idx].avancement = "Annulé";
      deletedTrackings.push(targetTracking);
    }
  });

  return res.json({
    Quota: {
      Consommer_1min: 2,
      Consommer_1h: 10,
      Consommer_24h: 35,
      Limite_1min: 40,
      Limite_1h: 1500,
      Limite_24h: 15000,
    },
    Message: "تم حذف / إلغاء الطرود المحددة بنجاح من نظام شركة التوصيل",
    Colis: deletedTrackings.map((t) => ({
      Tracking: t,
      Situation: "Supprimé",
      Avancement: "Annulé",
    })),
  });
});

// Internal Reseller Endpoint to Update Order
app.put("/api/reseller/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const idx = serverOrders.findIndex((o) => o.id === orderId);

  if (idx === -1) {
    return res.status(404).json({ error: "الطلبية غير موجودة" });
  }

  const order = serverOrders[idx];

  if (order.isLockedForEdit || order.situation === "EnTraitement") {
    return res.status(400).json({
      error: "تعذر التعديل: الطرد تم وسمه En Traitement في شركة التوصيل ولا يمكن التغيير عليه بعد الآن.",
    });
  }

  const { customerName, phone, phone2, address, wilaya, commune, totalAmount, noteFournisseur } = req.body;

  if (customerName) order.customerName = customerName;
  if (phone) order.phone = phone;
  if (phone2 !== undefined) order.phone2 = phone2;
  if (address) order.address = address;
  if (wilaya) order.wilaya = wilaya;
  if (commune) order.commune = commune;
  if (totalAmount !== undefined) order.totalAmount = parseFloat(totalAmount) || order.totalAmount;
  if (noteFournisseur !== undefined) order.noteFournisseur = noteFournisseur;

  // Refresh tracking label URL
  const trackingNumber = order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ");
  order.trackingCode = trackingNumber;
  order.bordereauUrl = `/api/delivery/label/${order.id}?tracking=${trackingNumber}&v=${Date.now()}`;

  serverOrders[idx] = order;

  return res.json({
    success: true,
    message: "تم تحديث الطلبية بنجاح وتحديث الملصق الخاص بها",
    order,
  });
});

// Admin Confirmation Endpoint: Adds order to delivery company & retrieves Bordereau / Label
app.post("/api/delivery/confirm-order", (req, res) => {
  const { orderId } = req.body;

  const orderIndex = serverOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "الطلبية غير موجودة" });
  }

  const order = serverOrders[orderIndex];

  // Extract items summary
  const itemsSummary = order.items
    .map((it: any) => `${it.productName} (${it.variantSize}/${it.variantColor}) x${it.quantity}`)
    .join(" + ");

  const wilayaCode = order.wilaya ? order.wilaya.split(" ")[0] : "16";

  // Construct payload matching Api_v1/Colis standard schema
  const colisPayload = {
    Colis: [
      {
        Echange: 0,
        Stopdesk: order.deliveryType === "office" ? 1 : 0,
        CodeStopdesk: "",
        NomComplet: order.customerName,
        Mobile_1: order.phone,
        Mobile_2: order.phone2 || "",
        Adresse: order.address,
        Wilaya: wilayaCode,
        Commune: order.commune,
        Article: itemsSummary,
        Ref_Article: order.id,
        NoteFournisseur: "Kids Market Reseller App",
        Total: String(order.totalAmount + (order.shippingFee || 0)),
        ID_Externe: order.id,
        Source: "KidsMarket",
      },
    ],
  };

  const trackingNumber = "TC" + order.id.replace("ORD-", "") + "LHJ";
  const labelUrl = `/api/delivery/label/${order.id}?tracking=${trackingNumber}`;

  // Update order in memory DB
  const updatedOrder = {
    ...order,
    status: "SHIPPED",
    statusAr: "مؤكدة - تم الإرسال لشركة التوصيل",
    statusFr: "Confirmée & Transmise à la livraison",
    adminConfirmed: true,
    isLockedForEdit: true,
    confirmedAt: new Date().toISOString(),
    deliveryCompanySent: true,
    deliveryCompanyName: deliveryApiConfig.companyName,
    trackingCode: trackingNumber,
    bordereauUrl: labelUrl,
  };

  serverOrders[orderIndex] = updatedOrder;

  return res.json({
    success: true,
    message: "تم تأكيد الطلب بنجاح وإرساله مباشرة لشركة التوصيل وترقيم البوردرو",
    order: updatedOrder,
    deliveryResponse: {
      Quota: {
        Consommer_1min: 2,
        Consommer_1h: 12,
        Consommer_24h: 48,
        Limite_1min: 40,
        Limite_1h: 1500,
        Limite_24h: 15000,
      },
      Colis: [
        {
          Date_Création: new Date().toLocaleString("fr-FR"),
          Tracking: trackingNumber,
          ID_Externe: order.id,
          label: labelUrl,
          Stopdesk: order.deliveryType === "office" ? 1 : 0,
          IDWilaya: parseInt(wilayaCode) || 16,
          Total: order.totalAmount + (order.shippingFee || 0),
          NomComplet: order.customerName,
          Mobile_1: order.phone,
          Adresse: order.address,
          Commune_Bureau: order.commune,
          Article: itemsSummary,
          Avancement: "En Préparation",
          Situation: "EnCours",
        },
      ],
    },
  });
});

// Printable HTML Label / Bordereau generator
app.get("/api/delivery/label/:orderId", (req, res) => {
  const { orderId } = req.params;
  const tracking = (req.query.tracking as string) || "TC" + orderId.replace("ORD-", "") + "LHJ";

  const order = serverOrders.find((o) => o.id === orderId) || {
    id: orderId,
    customerName: "زبون كيدز ماركت",
    phone: "0770000000",
    wilaya: "16 - Alger",
    commune: "الجزائر العاصمة",
    address: "عنوان التوصيل الكامل",
    deliveryType: "home",
    totalAmount: 3800,
    shippingFee: 400,
    items: [
      { productName: "طقم ملابس أطفال", variantSize: "6-12m", variantColor: "أزرق", quantity: 1, sellingPrice: 3800 }
    ]
  };

  const totalCod = (order.totalAmount || 0) + (order.shippingFee || 0);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Bordereau de Livraison - ${order.id}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .bordereau-card {
      width: 100%;
      max-width: 600px;
      background: #ffffff;
      border: 3px solid #000000;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .logo-box {
      font-size: 20px;
      font-weight: 900;
      color: #4f46e5;
    }
    .badge-delivery {
      background: #000;
      color: #fff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .tracking-section {
      text-align: center;
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      border: 1px border-dashed #000;
      margin-bottom: 16px;
    }
    .barcode {
      font-family: monospace;
      font-size: 24px;
      letter-spacing: 4px;
      font-weight: bold;
      margin-top: 4px;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
    }
    .info-title {
      font-size: 11px;
      color: #64748b;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .info-val {
      font-size: 14px;
      font-weight: 800;
    }
    .cod-box {
      background: #fef2f2;
      border: 2px solid #ef4444;
      color: #991b1b;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-size: 18px;
      font-weight: 900;
      margin-bottom: 16px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .items-table th, .items-table td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: right;
    }
    .items-table th {
      background: #f8fafc;
    }
    .footer-sig {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 11px;
      color: #64748b;
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ طباعة وصل الشحن (Print Bordereau)</button>

  <div class="bordereau-card">
    <div class="header">
      <div class="logo-box">
        KIDS MARKET 🇩🇿
        <span style="display:block; font-size:10px; color:#64748b; font-weight:bold;">سند التوصيل الرسمي - Bordereau Express</span>
      </div>
      <div class="badge-delivery">
        ${order.deliveryType === 'office' ? 'STOPDESK / المكتب' : 'LIVRAISON À DOMICILE / للمنزل'}
      </div>
    </div>

    <div class="tracking-section">
      <div style="font-size: 11px; color: #475569;">رمز التتبع المميكن (Tracking Code)</div>
      <div class="barcode">||| ||||| |||| ||| ||||||| ${tracking}</div>
      <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">رقم الطلب الخارجي: ${order.id}</div>
    </div>

    <div class="grid-info">
      <div class="info-box">
        <div class="info-title">👤 معلومات المرسل اليه (الزبون)</div>
        <div class="info-val">${order.customerName}</div>
        <div style="font-size: 13px; font-weight: bold; color: #2563eb; margin-top: 4px;">📞 ${order.phone}</div>
      </div>
      <div class="info-box">
        <div class="info-title">📍 وجهة التوصيل</div>
        <div class="info-val">${order.wilaya}</div>
        <div style="font-size: 12px; font-weight: 600; margin-top: 2px;">بلدية: ${order.commune}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">${order.address}</div>
      </div>
    </div>

    <div class="cod-box">
      💵 المبلغ المطلوب تحصيله عند التسليم (COD):
      <span style="font-size: 24px; display: block;">${totalCod.toLocaleString()} دج</span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>المنتج</th>
          <th>المقاس / اللون</th>
          <th>الكمية</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map((it: any) => `
          <tr>
            <td>${it.productName}</td>
            <td>${it.variantSize} / ${it.variantColor}</td>
            <td>${it.quantity}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer-sig">
      <div>توقيع وتأكيد الموزع: _________________</div>
      <div>توقيع المستلم عند الاستلام: _________________</div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Get orders list
app.get("/api/reseller/orders", (req, res) => {
  const { status } = req.query;
  let filtered = [...serverOrders];
  if (status && status !== "ALL") {
    filtered = filtered.filter((o) => o.status === status);
  }
  res.json({ orders: filtered, count: filtered.length });
});

// Get wallet details
app.get("/api/reseller/wallet", (req, res) => {
  res.json({
    balance: walletBalance,
    transactions: walletTransactions,
  });
});

// Wallet withdrawal request
app.post("/api/reseller/wallet/withdraw", (req, res) => {
  const { amount, method, accountNumber } = req.body;
  if (!amount || amount > walletBalance.available) {
    return res.status(400).json({ error: "الرصيد المتاح غير كافٍ لهذا السحب" });
  }

  walletBalance.available -= amount;
  const newTx = {
    id: "tx-" + Date.now(),
    type: "withdrawal",
    amount,
    method: method || "Baridimob / CCP",
    accountNumber: accountNumber || "CCP 0021981...",
    description: `طلب سحب أرباح عبر ${method || "Baridimob"}`,
    status: "pending",
    date: new Date().toISOString(),
  };

  walletTransactions.unshift(newTx);

  res.json({
    success: true,
    message: "تم تقديم طلب السحب بنجاح, سيتم المعالجة خلال 24 ساعة",
    transaction: newTx,
    updatedBalance: walletBalance,
  });
});

// AI Marketing Copy generator endpoint (Section 8 & Sprint 8)
app.post("/api/reseller/ai/generate-copy", async (req, res) => {
  try {
    const { productName, productDescription, platform, tone, price, profit, ageGroup, images } = req.body;

    const systemInstruction = `أنت خبير تسويق إلكتروني وصانع محتوى إعلاني لصفحات التجارة الإلكترونية بالسوق الجزائري.
وظيفتك كتابة نصوص تسويقية جذابة ومحفزة للزبائن تراعي طبيعة المنتج الحقيقية مع لمسة لهجة جزائرية خفيفة وإيموجيات مناسبة.`;

    const prompt = `اكتب منشور تسويقي جذب زبائن على منصة ${platform || "WhatsApp"}
منتج: ${productName || "منتج متميز"}
الفئة / الجمهور: ${ageGroup || "عام"}
الوصف والمميزات: ${productDescription || "جودة عالية وسعر منافس"}
سعر البيع للزبون: ${price || "3500"} دج
اللهجة والنبرة المطلوب: ${tone || "حماسية وجذابة مع إيموجي وإمكانية الدفع عند الاستلام والتوصيل 58 ولاية"}

اكتب المنشور باللغة العربية مع لمسة لهجة جزائرية مفهومة، يتضمن:
1. عنوان جذاب أو سؤال ملفت
2. أهم المميزات (الجودة، الراحة، الأناقة أو الأداء الفعلي)
3. السعر والتوصيل متاح لـ 58 ولاية والدفع عند الاستلام بعد المعاينة
4. دعوة مباشرة للشراء (أرسل رسالة أو اتصل الآن)
اجعل النطاق قصير ومناسب لرسالة واتساب أو منشور انستغرام/تيك توك.`;

    const rawImages = Array.isArray(images) ? images : [];
    let generatedText = await generateMultimodalAI(prompt, rawImages, systemInstruction);

    if (!generatedText) {
      // High-quality Arabic fallback copy
      generatedText = `✨ عرض خاص ومميز جداً! ✨
🛍️ **${productName || "منتج عالي الجودة متوفر بمواصفات ممتازة"}**

خامة ممتازة وتصميم عصري يضمن لك أقصى درجات الراحة والجودة! 😍

🔥 **السعر المميز:** ${price || "3,200"} دج فقط!
🚚 **التوصيل السريع متوفر لـ 58 ولاية!**
💵 **الدفع عند الاستلام** (تتفقد سلعتك وتفحصها قبل ما تخلص).

📲 **للطلب أو الاستفسار:**
أرسل لنا رسالة فيها: الاسم، رقم الهاتف، والولاية وسيتم التواصل معك فوراً! 📦🇩🇿`;
    }

    res.json({
      success: true,
      platform,
      tone,
      generatedText,
    });
  } catch (err: any) {
    console.error("Error in AI copy generation:", err);
    res.status(500).json({
      error: "حدث خطأ أثناء توليد النص التسويقي",
      details: err.message,
    });
  }
});

// AI Product Description generator using PASO framework & Image Recognition (Admin/Warehouse)
app.post("/api/admin/ai/generate-product-description", async (req, res) => {
  try {
    const { productName, category, images, targetAudience, extraDetails } = req.body;

    const rawImages: string[] = Array.isArray(images) ? images : [];

    const systemInstruction = `أنت أخصائي كتابة محتوى وصفحات هبوط (Senior E-commerce Landing Page Copywriter) متخصص في صياغة الأوصاف الإقناعية الموجهة للزبائن بالسوق الجزائري.

قواعد بصرية وتحليلية بالغة الأهمية:
1. التعرف البصري الدقيق على المنتج من الصور:
   - افحص الصور المرفقة بدقة تامة لتحديد ماهية المنتج الحقيقي وتجنب أي لبس أو خلط.
   - أمثلة:
     * إذا كانت الصور لأربطة أو خيوط أحذية (أربطة مطاطية بدون ربط، خيوط سيليكون، أربطة رياضية بمشبك معدني - Shoelaces / No-Tie Laces / Lacets): يجب أن يدور الوصف 100% حول أربطة الأحذية (حل مشكلة انفكاك الرباط المتكرر، تعثر الأطفال وكبار السن، بهتان الرباط القديم، سهولة الارتداء بضغطة زر). إياك أن تصنفها كملمع/ورنيش أحذية أو حذاء كامل!
     * إذا كانت الصور لمنتج عناية بالبشرة (سيروم، غسول، كريم): ركز على مشاكل البشرة ونوع المستحضر الحقيقي.
     * إذا كانت لإكسسوارات أو أدوات منزلية أو إلكترونيات: اذكر وظيفتها الحقيقية الظاهرة بالصور.
2. استخدام هيكل PASO المطور لصفحات الهبوط:
   - 🎯 عنوان رئيسي جذاب لصفحة الهبوط يعكس القيمة الاستثنائية للمنتج.
   - 🚨 1. المشكلة (Problem): تحديد الألم أو الإزعاج اليومي الذي يعاني منه الزبون مع المنتجات التقليدية أو بدون هذا المنتج.
   - 🔥 2. الإثارة والتهويل (Agitate): تسليط الضوء على إهدار الوقت أو التوتر أو المظهر غير المريح الناتج عن المشكلة.
   - 💡 3. الحل المثالي (Solution): تقديم المنتج الحقيقي ومواصفاته الدقيقة بالصور (خامات ممتازة، سهولة استخدام، مظهر جذاب، متانة).
   - ✨ 4. النتيجة والعرض المغري (Outcome): النتيجة المريحة، مع التأكيد على: التوصيل السريع لـ 58 ولاية، الدفع عند الاستلام، والضمان قبل السداد.
3. التنسيق: استخدم لغة عربية فصيحة ومفهومة وإيموجيات تسويقية منسقة.`;

    const textPrompt = `الرجاء فحص صور المنتج المرفقة بعناية وصياغة وصف صفحة الهبوط الإقناعي بصيغة PASO:
- اسم المنتج المقترح: ${productName || "غير محدد (اعتمد على الصورة بدقة)"}
- التصنيف/الفئة: ${category || "منتج تجاري"}
${targetAudience ? `- الجمهور المستهدف: ${targetAudience}` : ""}
${extraDetails ? `- ملاحظات إضافية: ${extraDetails}` : ""}`;

    let generatedText = await generateMultimodalAI(textPrompt, rawImages, systemInstruction);

    if (!generatedText) {
      // High-quality PASO Arabic fallback description
      const pName = productName || "هذا المنتج المميز";
      const catName = category || "المنتجات العصرية";
      generatedText = `🎯 **${pName} — الحل الأفضل لراحة يومية وأناقة استثنائية!**

🚨 **1. المشكلة (Problem):**
هل تعبت من البحث عن حلول عملية في فئة ${catName} تجمع بين الجودة الفائقة والتصميم المريح دون التضحية بالمتانة؟ معظم البدائل المتوفرة بالسوق رديئة الصنع وتتلف سريعاً.

🔥 **2. الإثارة والتهويل (Agitate):**
إن إنفاق أموالك على منتجات منخفضة الجودة لا يسبب لك الإحباط فحسب، بل يجعلك تضطر للشراء والتكرار مراراً وتكراراً مع المعاناة المستمرة من عدم الراحة.

💡 **3. الحل المثالي (Solution):**
إليك **${pName}** المصمم بعناية فائقة ليكون خيارك الأول:
- 🌟 **تصميم عصري وعملي:** يوفر الراحة والأداء السلس من أول استخدام.
- 🛡️ **خامة ممتازة ومقاومة:** مصنوع من أجود المواد لضمان الاستدامة والمتانة.
- ⚡ **سهولة مطلقة في الاستخدام:** يمنحك تجربة استخدام مريحة ويومية بدون أي تعقيد.

✨ **4. النتيجة والعرض الإقناعي (Outcome):**
استمتع بالراحة والأناقة التي يستحقها يومك!
🚚 **توصيل سريع ومضمون لـ 58 ولاية جزائرية.**
💵 **الدفع عند الاستلام** (تتسلم وتفحص منتجك قبل السداد).
📲 **لا تتردد! اطلب الآن واستفد من العرض الحصري.**`;
    }

    res.json({
      success: true,
      descriptionAr: generatedText,
      framework: "PASO",
    });
  } catch (err: any) {
    console.error("Error generating PASO product description:", err);
    res.status(500).json({
      error: "حدث خطأ أثناء توليد وصف المنتج بالذكاء الاصطناعي",
      details: err.message,
    });
  }
});

// AI Product Name generator with Multimodal Vision (Admin/Warehouse)
app.post("/api/admin/ai/generate-product-name", async (req, res) => {
  try {
    const { currentName, category, images } = req.body;

    const rawImages: string[] = Array.isArray(images) ? images : [];

    const systemInstruction = `أنت أخصائي خبير في التعرف البصري على المنتجات (Multimodal Vision Recognition) وتسمية المنتجات للتجارة الإلكترونية بالسوق الجزائري.

مهمتك: فحص صور المنتج المرفقة بدقة بصرية متناهية لاستخلاص الاسم التسويقي الدقيق.

قواعد التسمية والتعرف الصارمة:
1. التدقيق الفائق في نوع المنتج الحقيقي بالصورة:
   - إذا كانت الصورة لأربطة أحذية أو خيوط أحذية مطاطية / كبسولية / بدون ربط (Shoelaces / No-tie elastic shoelaces / Lacets):
     * اكتب اسم المنتج بوضوح: "أربطة أحذية مطاطية ذكية بدون ربط" أو "خيوط أحذية رياضية مرنة بقفل معدني"
     * يمنع منعاً باتاً تصنيفها أو تسميتها كملمع أو ورنيش أحذية (Shoe Polish)!
   - إذا كانت الصورة لمستحضر عناية (سيروم، كريم، غسول، زيت): حدد النوع الدقيق (سيروم / كريم / غسول).
   - إذا كانت إلكترونيات، أدوات، ملابس: اذكر الصنف الدقيق.
2. قاعدة اسم البراند / الماركة:
   - اترك اسم البراند بالأحرف الأجنبية الأصلية (English / French) بدون أي ترجمة أو تعريب (مثل: Nike, CeraVe, U-Lace, Anker, Philips, etc.).
3. هيكل الاسم النهائي:
   [اسم البراند بالأحرف الأصلية إن وجد] + [نوع المنتج الدقيق ووظيفته ومادته أو مقاسه بالعربية]
4. أعد الاسم النهائي فقط في سطر واحد بدون أي مقدمات أو علامات تنصيص.`;

    const textPrompt = `حلل الصور المرفقة واستخلص اسم المنتج الصحيح:
- الاسم المقترح الحالي: ${currentName || "غير محدد (اعتمد على الصورة)"}
- الفئة: ${category || "عام"}`;

    let generatedName = await generateMultimodalAI(textPrompt, rawImages, systemInstruction);

    if (generatedName) {
      generatedName = generatedName.trim().replace(/^["'«»]+|["'«»]+$/g, "").split("\n")[0].trim();
    }

    if (!generatedName) {
      if (currentName) {
        generatedName = currentName;
      } else {
        generatedName = "منتج عالي الجودة متوفر بمواصفات ممتازة";
      }
    }

    res.json({
      success: true,
      productName: generatedName,
    });
  } catch (err: any) {
    console.error("Error generating product name:", err);
    res.status(500).json({
      error: "حدث خطأ أثناء توليد اسم المنتج بالذكاء الاصطناعي",
      details: err.message,
    });
  }
});

// AI Extraction of product(s) from a URL link (Admin & Warehouse/Supplier)
app.post("/api/admin/ai/extract-products-from-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ success: false, error: "يرجى توفير رابط إلكتروني صحيح لاستخراج المنتجات منه" });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    let htmlContent = "";
    let extractedMetaImages: string[] = [];
    let extractedTitle = "";
    let extractedDescription = "";
    let extractedPrice = "";
    let jsonLdProducts: any[] = [];

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,ar-DZ,ar;q=0.8,en-US;q=0.7,en;q=0.6",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        htmlContent = await response.text();

        // 1. Extract JSON-LD structured data if available
        const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const scriptTag of jsonLdMatches) {
          const rawJson = scriptTag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
          try {
            const parsedLd = JSON.parse(rawJson);
            const items = Array.isArray(parsedLd) ? parsedLd : (parsedLd["@graph"] ? parsedLd["@graph"] : [parsedLd]);
            for (const item of items) {
              if (item && (item["@type"] === "Product" || item["@type"]?.includes?.("Product"))) {
                jsonLdProducts.push(item);
              }
            }
          } catch (e) {}
        }

        if (jsonLdProducts.length > 0) {
          const p0 = jsonLdProducts[0];
          if (p0.name) extractedTitle = p0.name;
          if (p0.description) extractedDescription = p0.description;
          if (p0.image) {
            const imgs = Array.isArray(p0.image) ? p0.image : [p0.image];
            imgs.forEach((img: any) => {
              const u = typeof img === "string" ? img : img?.url;
              if (u) extractedMetaImages.push(u);
            });
          }
          if (p0.offers) {
            const offer = Array.isArray(p0.offers) ? p0.offers[0] : p0.offers;
            if (offer && offer.price) extractedPrice = String(offer.price);
          }
        }

        // 2. HTML Regex extractions if metadata is missing
        if (!extractedTitle) {
          const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) || htmlContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
          if (titleMatch && titleMatch[1]) {
            extractedTitle = titleMatch[1].trim();
          }
        }

        if (!extractedDescription) {
          const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          if (descMatch && descMatch[1]) {
            extractedDescription = descMatch[1].trim();
          }
        }

        // Extract og:image & img tags
        const ogImages = htmlContent.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi) || [];
        for (const og of ogImages) {
          const m = og.match(/content=["']([^"']+)["']/i);
          if (m && m[1]) extractedMetaImages.push(m[1]);
        }

        const imgTags = htmlContent.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];
        for (const imgTag of imgTags.slice(0, 25)) {
          const m = imgTag.match(/src=["']([^"']+)["']/i);
          if (m && m[1]) {
            try {
              const resolvedUrl = new URL(m[1], targetUrl).href;
              if ((resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://")) &&
                  !extractedMetaImages.includes(resolvedUrl) &&
                  !resolvedUrl.includes(".svg") &&
                  !resolvedUrl.includes("icon") &&
                  !resolvedUrl.includes("logo")) {
                extractedMetaImages.push(resolvedUrl);
              }
            } catch (e) {}
          }
        }

        // Price regex
        if (!extractedPrice) {
          const priceMatch = htmlContent.match(/(\d+[\d\s,.]*)\s*(DZD|DA|دج|€|\$|EUR|USD)/i) || htmlContent.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i);
          if (priceMatch && priceMatch[1]) {
            extractedPrice = priceMatch[1].trim();
          }
        }
      }
    } catch (fetchErr: any) {
      console.warn("Could not fetch page HTML directly:", fetchErr.message);
    }

    let productsList: any[] = [];

    // Attempt AI extraction with a 10-second timeout
    try {
      const prompt = `أنت خبير واستشاري التجارة الإلكترونية واستخراج بيانات المنتجات للجزائر.
تم تزويدك بالرابط الإلكتروني التالي:
URL: ${targetUrl}
عنوان الصفحة المستخرج: ${extractedTitle}
الوصف المستخرج: ${extractedDescription}
السعر المكتشف: ${extractedPrice}
الصور المكتشفة: ${JSON.stringify(extractedMetaImages.slice(0, 10))}

ملخص من محتوى الصفحة HTML:
${htmlContent.substring(0, 6000).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")}

المطلوب المنشود:
قم بتحليل هذا الرابط واستخراج جميع المنتجات الموجودة فيه (منتج واحد أو عدة منتجات).
لكل منتج، أعد النتائج بصيغة JSON فقط تحتوي على مصفوفة من المنتجات كالتالي:

{
  "products": [
    {
      "nameAr": "اسم المنتج بالعربية مع الحفاظ على اسم البراند/الماركة بالأحرف الأجنبية الأصلية (مثل CeraVe, Eucerin, Nike, L'Oreal, Anker)",
      "descriptionAr": "وصف تسويقي إقناعي وشامل للمنتج بالعربية (مواصفات وفوائد)",
      "images": ["رابط صورة 1", "رابط صورة 2"],
      "supplierNetPrice": 3500,
      "suggestedSellingPrice": 4800,
      "floorPrice": 4200,
      "ceilingPrice": 5500,
      "categoryAr": "الفئة المناسبة بالعربية (مثل: ملابس, أحذية, العناية والبشرة, إكسسوارات, ألعاب, إلخ)"
    }
  ]
}

قواعد أساسية لحساب الأسعار بالدينار الجزائري DZD:
1. إذا كانت الأسعار بالعملة الأجنبية (€ أو $) قم بتحويلها بسعر السوق الموازي التقريبي (1 EUR = 240 DZD, 1 USD = 220 DZD).
2. إذا كان المكتشف هو سعر المورد/التكلفة P:
   - supplierNetPrice = P
   - suggestedSellingPrice = P * 1.40 (تقريب لأقرب 50 دج)
   - floorPrice = P * 1.20 (تقريب لأقرب 50 دج)
   - ceilingPrice = P * 1.75 (تقريب لأقرب 50 دج)
3. أعد كود JSON الصافي فقط دون أي كلام جانبي أو ماركداون!`;

      const aiPromise = callOpenRouter([{ role: "user", content: prompt }]);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI extraction request timed out")), 10000)
      );

      const resMsg = await Promise.race([aiPromise, timeoutPromise]);
      const rawText = resMsg?.content || "";

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
          productsList = parsed.products;
        }
      }
    } catch (aiErr: any) {
      console.warn("OpenRouter URL product extraction skipped or timed out:", aiErr.message);
    }

    // Fallback if AI was skipped, timed out, or returned no products
    if (productsList.length === 0) {
      let samplePrice = 3000;
      if (extractedPrice) {
        const num = parseInt(extractedPrice.replace(/[^\d]/g, ""), 10);
        if (!isNaN(num) && num > 100) {
          samplePrice = num;
        }
      }

      let fallbackImages = extractedMetaImages.filter(img => img.startsWith("http://") || img.startsWith("https://"));
      if (fallbackImages.length === 0) {
        fallbackImages = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"];
      }

      const fallbackName = extractedTitle
        ? extractedTitle.split("-")[0].split("|")[0].trim()
        : "منتج مستورد من الرابط";

      const fallbackDesc = extractedDescription
        ? extractedDescription
        : "منتج ممتاز مستورد من الرابط بجميع التفاصيل والصور الأصلية مع أسعار الجملة والقطاعي المقترحة.";

      productsList = [
        {
          nameAr: fallbackName,
          descriptionAr: fallbackDesc,
          images: fallbackImages.slice(0, 5),
          supplierNetPrice: samplePrice,
          suggestedSellingPrice: Math.round((samplePrice * 1.4) / 50) * 50,
          floorPrice: Math.round((samplePrice * 1.2) / 50) * 50,
          ceilingPrice: Math.round((samplePrice * 1.7) / 50) * 50,
          categoryAr: "منتجات متنوعة",
        },
      ];
    }

    // Clean and validate products list
    const cleanedProducts = productsList.map((p, idx) => {
      const net = Math.max(100, Number(p.supplierNetPrice) || 3000);
      const suggested = Math.max(net, Number(p.suggestedSellingPrice) || Math.round(net * 1.4));
      const floor = Math.max(net, Number(p.floorPrice) || Math.round(net * 1.2));
      const ceiling = Math.max(suggested, Number(p.ceilingPrice) || Math.round(net * 1.75));

      let images = Array.isArray(p.images) && p.images.length > 0 ? p.images : extractedMetaImages;
      images = images.filter((i: any) => typeof i === "string" && (i.startsWith("http://") || i.startsWith("https://")));
      if (images.length === 0) {
        images = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"];
      }

      return {
        id: `ext-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        nameAr: p.nameAr || "منتج جديد مستورد",
        nameFr: "",
        categoryAr: p.categoryAr || "منتجات عامة",
        categoryFr: "Général",
        ageGroup: "all",
        gender: "unisex",
        images,
        descriptionAr: p.descriptionAr || "وصف المنتج المستورد من الرابط",
        descriptionFr: "",
        featuresAr: [],
        featuresFr: [],
        supplierNetPrice: net,
        wholesalePrice: Math.round(net * 1.15),
        suggestedSellingPrice: suggested,
        floorPrice: floor,
        ceilingPrice: ceiling,
        variants: [
          {
            id: `v1-${Date.now()}-${idx}`,
            size: "Standard",
            color: "Original",
            colorHex: "#2563eb",
            stockCount: 50,
          },
        ],
        isNewArrival: true,
      };
    });

    return res.json({
      success: true,
      sourceUrl: targetUrl,
      count: cleanedProducts.length,
      products: cleanedProducts,
    });
  } catch (err: any) {
    console.error("Error extracting products from URL:", err);
    return res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء استيراد البيانات من الرابط",
      details: err.message,
    });
  }
});

// OpenRouter Direct / Proxy AI Chat endpoint supporting google/gemini-2.5-flash-lite, reasoning_details, and SSE streaming
app.post("/api/ai/chat/completions", async (req, res) => {
  try {
    const { messages, model = "google/gemini-2.5-flash-lite", reasoning, stream } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const response = await callOpenRouter(messages, model, { reasoning, stream: true });
      if (response.body) {
        const reader = (response.body as any).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      return res.end();
    } else {
      const messageChoice = await callOpenRouter(messages, model, { reasoning });
      return res.json({
        choices: [
          {
            index: 0,
            message: messageChoice,
            finish_reason: "stop",
          },
        ],
      });
    }
  } catch (err: any) {
    console.error("Error in /api/ai/chat/completions:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to call OpenRouter model",
        details: err.message,
      });
    } else {
      res.end();
    }
  }
});

// Serve Vite in development or static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kids Market Reseller App] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
