import 'dotenv/config.js'
import './config/database.js'
import cors from 'cors'
import createError from 'http-errors'; // Módulo para crear errores HTTP
import express from 'express'; // Marco de trabajo para crear aplicaciones web
import cookieParser from 'cookie-parser'; // Módulo para analizar cookies de las solicitudes
import logger from 'morgan'; // Módulo para el registro (logging) de solicitudes y respuestas
import path from 'path'; // Módulo para trabajar con rutas de archivos y directorios
import indexRouter from './routes/index.js'; // Enrutador para la página principal
import { __dirname } from './utils/util.js';
import { Server } from 'socket.io';
import http from 'http';
// Crear una instancia de la aplicación Express
const app = express();

/* el método .use se utiliza para agregar middleware a la cadena de manejo de solicitudes. El middleware es una función que se ejecuta en el proceso de manejo de una solicitud HTTP antes de que llegue a su manejador final. Esto permite realizar tareas como la autenticación, validación de datos, manipulación de encabezados, entre otras, antes de que la solicitud llegue a la ruta o función de manejo principal. */
app.use(
  cors()
);
app.use(logger('dev')); // Configurar el registro de solicitudes en modo "dev"
app.use(express.json()); // Analizar solicitudes JSON
app.use(express.urlencoded({ extended: false })); // Analizar solicitudes de formularios
app.use(cookieParser()); // Analizar cookies en las solicitudes
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos desde la carpeta "public"

// Configurar enrutadores para rutas específicas
app.use('/', indexRouter); // Usar el enrutador para la página principal


// Capturar solicitudes no manejadas y generar un error 404
app.use((req, res, next) => {
  next(createError(404));
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  // Configurar información del error para mostrar en el entorno de desarrollo
  const errorDetails = req.app.get('env') === 'development' 
    ? { message: err.message, error: err }
    : { message: err.message };

  // Enviar respuesta JSON con el error
  res.status(err.status || 500).json(errorDetails);
});

// Crear servidor HTTP
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permite todos los orígenes temporalmente
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    skipMiddlewares: true,
  }
});

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

   // Operador se une a su sala personal
  socket.on('joinOperatorRoom', (operatorId) => {
    socket.join(`operator_${operatorId}`);
    console.log(`Operador ${operatorId} (${socket.id}) unido a su sala`);
  });

  socket.on('leaveOperatorRoom', (operatorId) => {
    socket.leave(`operator_${operatorId}`);
    console.log(`Operador ${operatorId} (${socket.id}) salio de su sala`);
  });

  // Manejar unión a sala de orden específica
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Cliente ${socket.id} unido a orden ${orderId}`);
  });

  // Manejar salida de sala de orden
  socket.on('leaveOrderRoom', (orderId) => {
    socket.leave(`order_${orderId}`);
    console.log(`Cliente ${socket.id} salió de orden ${orderId}`);
  });

  // Manejar actualización de ubicación del operador
  socket.on('updateOperatorLocation', (data) => {
    const { orderId, location } = data;
    // Emitir solo a los clientes en la sala de esta orden
    io.to(`order_${orderId}`).emit('operatorLocationUpdate', {
      orderId,
      location
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Exportar ambos servidores
export { app, httpServer as server, io };
