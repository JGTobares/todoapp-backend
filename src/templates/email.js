// Email template for error notifications

const errorEmailTemplate = (logObject) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f6f8;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .header {
        background: #d32f2f;
        color: #fff;
        padding: 16px;
        text-align: center;
      }
      .content {
        padding: 20px;
        color: #333;
      }
      .content h2 {
        margin-top: 0;
        color: #d32f2f;
      }
      .log-details {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
        margin-top: 12px;
        font-size: 14px;
      }
      .footer {
        text-align: center;
        padding: 12px;
        font-size: 12px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ Error en API Tasks</h1>
      </div>
      <div class="content">
        <h2>Se ha detectado un error 500</h2>
        <p>Estimado gestor, la API ha registrado un fallo interno. Aquí están los detalles:</p>
        <div class="log-details">
          <p><strong>Fecha:</strong> ${logObject.date}</p>
          <p><strong>Método:</strong> ${logObject.method}</p>
          <p><strong>Ruta:</strong> ${logObject.url}</p>
          <p><strong>IP:</strong> ${logObject.ip}</p>
          <p><strong>User-Agent:</strong> ${logObject.userAgent}</p>
          <p><strong>Tiempo de respuesta:</strong> ${logObject.responseTime}</p>
        </div>
        <p>Por favor, revisa el sistema para identificar la causa del error.</p>
      </div>
      <div class="footer">
        <p>Este es un mensaje automático generado por el sistema de monitoreo.</p>
      </div>
    </div>
  </body>
  </html>
  `
}

export { errorEmailTemplate }
