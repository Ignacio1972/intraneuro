const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validar entrada
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos' 
            });
        }
        
        // Buscar usuario
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Usuario o contraseña incorrectos' 
            });
        }
        
        // TEMPORAL: Comparar sin hash (en producción usar bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ 
                error: 'Usuario o contraseña incorrectos' 
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
