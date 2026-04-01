import Officer from "../models/Officer.js";

export async function createOfficer(req, res) {
  try {
    const { name, title, image, bio } = req.body;
    const officer = await Officer.create({
      name,
      title,
      image: image || "",
      bio: bio || "",
    });
    res.status(201).json(officer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
}

export async function getOfficers(req, res) {
  try {
    const officers = await Officer.find().sort({ createdAt: 1 });
    res.json(officers);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
}

export async function updateOfficer(req, res) {
  try {
    const { uid } = req.params;
    const updated = await Officer.findOneAndUpdate({ uid }, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Officer not found" },
      });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
}

export async function deleteOfficer(req, res) {
  try {
    const { uid } = req.params;
    const deleted = await Officer.findOneAndDelete({ uid });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Officer not found" },
      });
    }
    res.json({ success: true, message: "Officer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
}
