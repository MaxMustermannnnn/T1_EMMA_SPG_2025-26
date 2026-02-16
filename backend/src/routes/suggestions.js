const express = require("express");
const router = express.Router();
const vehicleData = require("../data/vehicles.json");

// Get all brands by type or filter by search term
router.get("/brands", (req, res) => {
  try {
    const type = req.query.type || "PKW";
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : "";
    
    // Get brands for the specified type
    const typeBrands = vehicleData[type] || [];
    let brands = typeBrands.map(b => b.name);
    
    if (searchTerm) {
      brands = brands.filter(brand => 
        brand.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(brands);
  } catch (error) {
    console.error("GET BRANDS ERROR:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Get models by brand and type
router.get("/models/:brand", (req, res) => {
  try {
    const brand = req.params.brand;
    const type = req.query.type || "PKW";
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : "";
    
    // Get brand data for the specified type
    const typeBrands = vehicleData[type] || [];
    const brandData = typeBrands.find(
      b => b.name.toLowerCase() === brand.toLowerCase()
    );
    
    if (!brandData) {
      return res.json([]);
    }
    
    let models = brandData.models;
    
    if (searchTerm) {
      models = models.filter(model => 
        model.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(models);
  } catch (error) {
    console.error("GET MODELS ERROR:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;

