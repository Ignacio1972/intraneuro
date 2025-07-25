const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};
