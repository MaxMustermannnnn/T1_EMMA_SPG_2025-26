const jwt = require("jsonwebtoken"); // nutzt process.env.JWT_SECRET

// Middleware schützt Routen: prüft Authorization-Header und validiert JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // erwartet "Bearer <token>"

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
    // Token prüfen und Nutzerdaten in req.user ablegen
    // decoded enthält z.B. { id, email }, weil beim Signen gesetzt
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Abgelaufene oder ungültige Tokens abfangen
    return res.status(401).json({ error: "Token ungültig oder abgelaufen" });
  }
}

module.exports = authMiddleware;
