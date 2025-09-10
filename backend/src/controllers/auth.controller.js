const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Login - MODIFICADO PARA SOLO CLAVE
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validar entrada - solo password es realmente importante
        if (!password) {
            return res.status(400).json({ 
                error: 'Clave de acceso requerida' 
            });
        }
        
        // Siempre buscar el usuario 'sistema'
        const user = await User.findOne({ where: { username: 'sistema' } });
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Sistema no configurado. Contacte al administrador.' 
            });
        }
        
        // TEMPORAL: Comparar sin hash (en producción usar bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ 
                error: 'Clave de acceso incorrecta' 
            });
        }
        
        // Generar token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                full_name: user.full_name,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Verificar token
exports.verifyToken = async (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
};
