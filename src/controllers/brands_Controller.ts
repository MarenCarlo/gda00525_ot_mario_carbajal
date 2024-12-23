import { Request, Response } from 'express';
import { categoryOptionalSchema, categorySchema } from '../shared/joiDataValidations/categoryController_joi';
import sequelize from '../database/connection';
import CategoriaProducto from '../models/tb_categorias_productos';
import { brandOptionalSchema, brandSchema } from '../shared/joiDataValidations/brandController_joi';
import MarcaProducto from '../models/tb_marcas_productos';

class BrandsController {

    /**
    * Este Endpoint sirve para obtener la data de las Marcas
    */
    public async getBrands(req: Request, res: Response) {
        const ip = req.socket.remoteAddress;
        console.info(ip);
        try {
            const marcas = await MarcaProducto.findAll({
                attributes: ['idMarcaProducto', 'nombre', 'descripcion', 'fecha_creacion'],
            });
            if (marcas.length === 0) {
                return res.status(404).json({
                    error: true,
                    message: 'No se encontraron marcas de productos.',
                    data: []
                });
            }
            return res.status(200).json({
                error: false,
                message: 'Marcas obtenidas exitosamente.',
                data: marcas
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: true,
                message: 'Hubo un problema al obtener las marcas.',
                data: { error }
            });
        }
    }

    /**
    * Este Endpoint sirve para registrar nuevas empresas en la APP
    */
    public async addBrand(req: Request, res: Response) {
        const ip = req.socket.remoteAddress;
        console.info(ip);
        const {
            nombre,
            descripcion
        } = req.body;
        let nombreFormatted;
        if (nombre !== null && nombre !== undefined) {
            nombreFormatted = nombre
                .toLowerCase()
                .split(' ')
                .map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
                .join(' ');
        }
        const { error } = brandSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: true,
                message: error.details[0].message,
                data: {}
            });
        }
        try {
            /**
             * Ejecucion del Procedimiento Almacenado
             */
            const result: any = await sequelize.query(
                'EXEC sp_Crear_Marca_Producto :nombre, :descripcion;',
                {
                    replacements: {
                        nombre: nombreFormatted,
                        descripcion
                    }
                }
            );
            /**
             * Respuesta del servidor
             */
            const nuevoID = result[0][0].NuevoID;
            return res.status(201).json({
                error: false,
                message: 'Marca agregada exitosamente.',
                data: { nuevoID },
            });
        } catch (error: any) {
            /**
             * Condiciones de Datos Duplicados en restricciones de
             * UNIQUE
             */
            if (error.name === 'SequelizeUniqueConstraintError') {
                const uniqueError = error.errors[0];
                const conflictingValue = uniqueError?.value
                if (uniqueError?.message.includes('must be unique')) {
                    return res.status(409).json({
                        error: true,
                        message: `${conflictingValue} ya existe en BD.`,
                        data: {}
                    });
                }
            }
            /**
             * Manejo de Errores generales de la BD.
             */
            return res.status(500).json({
                error: true,
                message: 'Hay problemas al procesar la solicitud.',
                data: {
                    error
                }
            });
        }
    }

    /**
     * Este Endpoint sirve para editar la data de empresas en la APP
     */
    public async modifyBrand(req: Request, res: Response) {
        const ip = req.socket.remoteAddress;
        console.info(ip);
        const {
            idMarcaProducto,
            nombre = null,
            descripcion = null
        } = req.body;
        let nombreFormatted = null;
        if (nombre !== null && nombre !== undefined) {
            nombreFormatted = nombre
                .toLowerCase()
                .split(' ')
                .map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
                .join(' ');
        }
        // Validacion si idCategoriaProducto no es un número o es <= 0
        if (typeof idMarcaProducto === 'number' && !isNaN(idMarcaProducto) && idMarcaProducto > 0) {
            //Validacion de Data ingresada por los usuarios
            const { error } = brandOptionalSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    error: true,
                    message: error.details[0].message,
                    data: {}
                });
            }
            try {
                // Búsqueda de la existencia de la Empresa
                let categoriaProductoDB = await MarcaProducto.findOne({
                    where: {
                        idMarcaProducto: idMarcaProducto
                    },
                });
                if (!categoriaProductoDB) {
                    return res.status(403).json({
                        error: true,
                        message: "El ID de Marca que se busca modificar, no existe en BD.",
                        data: {}
                    });
                }
                // OBJETO DE DATOS MSSQL
                const replacements: any = {
                    idMarcaProducto,
                    nombre: nombreFormatted,
                    descripcion
                };
                // Ejecucion el procedimiento almacenado
                await sequelize.query(
                    'EXEC sp_Editar_Marca_Producto :idMarcaProducto, :nombre, :descripcion;',
                    {
                        replacements: replacements
                    }
                );
                /**
                 * Respuesta del Servidor
                 */
                return res.status(201).json({
                    error: false,
                    message: 'Data de Marca modificada exitosamente.',
                    data: {},
                });
            } catch (error: any) {
                /**
                 * Condiciones de Datos Duplicados en restricciones de
                 * UNIQUE
                 */
                if (error.name === 'SequelizeUniqueConstraintError') {
                    const uniqueError = error.errors[0];
                    const conflictingValue = uniqueError?.value
                    if (uniqueError?.message.includes('must be unique')) {
                        return res.status(409).json({
                            error: true,
                            message: `${conflictingValue} ya existe en DB.`,
                            data: {}
                        });
                    }
                }
                /**
                 * Manejo de Errores generales de la BD.
                 */
                return res.status(500).json({
                    error: true,
                    message: 'Hay problemas al procesar la solicitud.',
                    data: {
                        error
                    }
                });
            }
        } else {
            return res.status(404).json({
                error: true,
                message: "Id de Marca no valido.",
                data: {}
            });
        }
    }
}

export const brandsController = new BrandsController();