import { NextFunction, Request, Response } from 'express';

/**
 * MIDDLEWARE
 * 
 * Validacion de usuario con rol de Administrador
 */
const validateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user!.rol.idRol === 1) {
        next();
    } else {
        return res.status(401).json({
            error: true,
            message: 'No tiene los permisos suficientes para realizar esta acción.',
            data: {}
        })
    }
}

export default validateAdmin;