const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

const verifyToken = (req, res, next) => {
    // 1. Authorization Header check karna
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: "Access Denied! No token provided." 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Token Verify karna
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. User info request object me attach karna
        req.user = decoded; 
        
        // 4. Next controller/route par allow karna
        next();
    } catch (error) {
        console.error("Auth Error:", error.message);
        return res.status(403).json({ 
            success: false, 
            message: "Invalid or expired token. Please login again." 
        });
    }
};

module.exports = verifyToken;