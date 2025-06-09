// websocket.js
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';

// Configuración
const JWT_SECRET = process.env.JWT_SECRET;

// Almacenamiento de conexiones
const connections = new Map(); // userId -> Set<WebSocket>
const orderSubscriptions = new Map(); // orderId -> Set<userId>

/**
 * Configura y retorna un servidor WebSocket
 * @param {Object} server - Servidor HTTP
 * @returns {WebSocket.Server} - Servidor WebSocket
 */
export function setupWebsocket(server) {
  console.log('Inicializando servidor WebSocket...');
  
  const wss = new WebSocket.Server({ 
    server,
    // Verificar token en la conexión
    verifyClient: (info, cb) => {
      try {
        const { query } = url.parse(info.req.url, true);
        
        if (!query.token) {
          console.log('WebSocket: Intento de conexión sin token');
          cb(false, 401, 'Unauthorized');
          return;
        }
        
        const decoded = jwt.verify(query.token, JWT_SECRET);
        info.req.user = decoded;
        cb(true);
      } catch (err) {
        console.log('WebSocket: Token inválido', err.message);
        cb(false, 401, 'Invalid token');
      }
    }
  });

  // Evento de conexión
  wss.on('connection', (ws, req) => {
    const userId = req.user.id;
    console.log(`WebSocket: Usuario ${userId} conectado`);
    
    // Guardar referencia a la conexión
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId).add(ws);
    
    // Configurar evento de mensajes
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(ws, data, userId);
      } catch (err) {
        console.error('Error al procesar mensaje:', err);
      }
    });
    
    // Configurar evento de cierre
    ws.on('close', () => {
      console.log(`WebSocket: Usuario ${userId} desconectado`);
      
      // Limpiar suscripciones
      orderSubscriptions.forEach((subscribers, orderId) => {
        if (subscribers.has(userId)) {
          subscribers.delete(userId);
        }
      });
      
      // Limpiar conexiones
      if (connections.has(userId)) {
        connections.get(userId).delete(ws);
        if (connections.get(userId).size === 0) {
          connections.delete(userId);
        }
      }
    });
    
    // Enviar confirmación
    ws.send(JSON.stringify({ 
      type: 'connection_established',
      userId
    }));
  });
  
  console.log('Servidor WebSocket iniciado');
  return wss;
}

/**
 * Procesa los mensajes del cliente
 * @param {WebSocket} ws - Conexión WebSocket
 * @param {Object} data - Datos del mensaje
 * @param {string} userId - ID del usuario
 */
function handleClientMessage(ws, data, userId) {
  if (!data.type) return;
  
  switch (data.type) {
    // Responder a ping para mantener la conexión viva
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    // Suscripción a actualizaciones de órdenes
    case 'subscribe':
      if (data.entity === 'order' && data.id) {
        subscribeToOrder(userId, data.id);
        ws.send(JSON.stringify({ 
          type: 'subscription_success', 
          entity: 'order',
          id: data.id
        }));
      }
      break;
      
    // Cancelar suscripción
    case 'unsubscribe':
      if (data.entity === 'order' && data.id) {
        unsubscribeFromOrder(userId, data.id);
        ws.send(JSON.stringify({ 
          type: 'unsubscription_success', 
          entity: 'order',
          id: data.id
        }));
      }
      break;
      
    default:
      console.warn(`Tipo de mensaje no reconocido: ${data.type}`);
  }
}

/**
 * Suscribe a un usuario a actualizaciones de una orden
 * @param {string} userId - ID del usuario
 * @param {string} orderId - ID de la orden
 */
function subscribeToOrder(userId, orderId) {
  if (!orderSubscriptions.has(orderId)) {
    orderSubscriptions.set(orderId, new Set());
  }
  orderSubscriptions.get(orderId).add(userId);
  console.log(`Usuario ${userId} suscrito a orden ${orderId}`);
}

/**
 * Cancela la suscripción de un usuario a una orden
 * @param {string} userId - ID del usuario
 * @param {string} orderId - ID de la orden
 */
function unsubscribeFromOrder(userId, orderId) {
  if (orderSubscriptions.has(orderId)) {
    orderSubscriptions.get(orderId).delete(userId);
    if (orderSubscriptions.get(orderId).size === 0) {
      orderSubscriptions.delete(orderId);
    }
    console.log(`Usuario ${userId} canceló suscripción a orden ${orderId}`);
  }
}

/**
 * Notifica a los usuarios cuando cambia el estado de una orden
 * @param {string} orderId - ID de la orden
 * @param {string} status - Nuevo estado
 * @param {Object} additionalData - Datos adicionales para enviar
 */
export function notifyOrderStatusChange(orderId, status, additionalData = {}) {
  // Crear mensaje de notificación
  const notification = {
    type: 'order_status_update',
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Enviar a suscriptores específicos de esta orden
  if (orderSubscriptions.has(orderId)) {
    const subscribers = orderSubscriptions.get(orderId);
    subscribers.forEach(userId => {
      sendToUser(userId, notification);
    });
  }
  
  // También enviar al propietario de la orden
  if (additionalData.ownerId && !orderSubscriptions.has(orderId)?.has(additionalData.ownerId)) {
    sendToUser(additionalData.ownerId, notification);
  }
  
  console.log(`Notificación de cambio de estado enviada para orden ${orderId}: ${status}`);
}

/**
 * Notifica actualizaciones de ubicación del operador
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @param {Object} location - Datos de ubicación
 */
export function notifyOperatorLocationUpdate(orderId, operatorId, location) {
  if (orderSubscriptions.has(orderId)) {
    const notification = {
      type: 'operator_location_update',
      orderId,
      operatorId,
      location,
      timestamp: new Date().toISOString()
    };
    
    const subscribers = orderSubscriptions.get(orderId);
    subscribers.forEach(userId => {
      sendToUser(userId, notification);
    });
    
    console.log(`Notificación de ubicación enviada para orden ${orderId}`);
  }
}

/**
 * Envía un mensaje a un usuario específico (todas sus conexiones)
 * @param {string} userId - ID del usuario
 * @param {Object} data - Datos a enviar
 * @returns {boolean} - true si se envió a al menos una conexión
 */
export function sendToUser(userId, data) {
  if (!connections.has(userId)) {
    return false;
  }
  
  let sent = false;
  const userConnections = connections.get(userId);
  
  userConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      sent = true;
    }
  });
  
  return sent;
}

/**
 * Envía un mensaje a todos los usuarios conectados
 * @param {Object} data - Datos a enviar
 * @returns {number} - Número de usuarios que recibieron el mensaje
 */
export function broadcast(data) {
  let count = 0;
  
  connections.forEach((userConnections, userId) => {
    if (sendToUser(userId, data)) {
      count++;
    }
  });
  
  return count;
}

export default {
  setupWebsocket,
  notifyOrderStatusChange,
  notifyOperatorLocationUpdate,
  sendToUser,
  broadcast
};