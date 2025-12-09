const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Kein Header → nicht eingeloggt
  if (!authHeader) {
    return res.status(401).json({ error: "Kein Token übermittelt" });
  }

  // Erwartet: "Bearer <token>"
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Ungültiges Token-Format" });
  }

  try {
    // Token prüfen
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // z.B. { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token ungültig oder abgelaufen" });
  }
}

module.exports = authMiddleware;
